import { NextApiRequest, NextApiResponse } from 'next'
import { rateLimiter } from 'next-rate-limit'
import csrf from 'csrf'

// Rate limiting configuration
const limiter = rateLimiter({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique tokens per interval
})

// CSRF token generator
const csrfTokens = csrf()

// Rate limiting middleware
export async function withRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  maxRequests: number = 100
) {
  try {
    await limiter.check(res, maxRequests, 'CACHE_TOKEN')
  } catch (error) {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    })
    return false
  }
  return true
}

// CSRF protection middleware
export function withCSRFProtection(
  req: NextApiRequest,
  res: NextApiResponse,
  secret?: string
) {
  // Require CSRF_SECRET environment variable in production
  const csrfSecret = secret || process.env.CSRF_SECRET
  if (!csrfSecret) {
    console.error('CSRF_SECRET environment variable is required')
    res.status(500).json({
      success: false,
      error: 'Server configuration error',
      code: 'CSRF_SECRET_MISSING'
    })
    return false
  }
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return true // Safe methods don't need CSRF protection
  }

  const token = req.headers['x-csrf-token'] as string
  if (!token) {
    res.status(403).json({
      success: false,
      error: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING'
    })
    return false
  }

  try {
    const isValid = csrfTokens.verify(csrfSecret, token)
    if (!isValid) {
      res.status(403).json({
        success: false,
        error: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID'
      })
      return false
    }
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'CSRF token verification failed',
      code: 'CSRF_TOKEN_VERIFICATION_FAILED'
    })
    return false
  }

  return true
}

// Generate CSRF token
export function generateCSRFToken(secret?: string) {
  const csrfSecret = secret || process.env.CSRF_SECRET
  if (!csrfSecret) {
    throw new Error('CSRF_SECRET environment variable is required')
  }
  return csrfTokens.create(csrfSecret)
}

// Input sanitization middleware
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/[&<>"']/g, (char) => {
        const escapeMap: { [key: string]: string } = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;'
        }
        return escapeMap[char]
      })
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item))
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key])
      }
    }
    return sanitized
  }
  
  return input
}

// IP validation middleware
export function validateIP(req: NextApiRequest): boolean {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress
  
  // Block known malicious IPs or patterns
  const blockedIPs = [
    // Add known malicious IPs here
  ]
  
  const blockedPatterns = [
    /^127\.0\.0\.1$/, // Localhost (if not in development)
    /^192\.168\./, // Private networks (if not in development)
    /^10\./, // Private networks (if not in development)
  ]
  
  if (process.env.NODE_ENV === 'production') {
    const clientIP = Array.isArray(ip) ? ip[0] : ip
    
    if (blockedIPs.includes(clientIP)) {
      return false
    }
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(clientIP)) {
        return false
      }
    }
  }
  
  return true
}

// Security headers middleware
export function setSecurityHeaders(res: NextApiResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';")
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
}

// Comprehensive security middleware
export async function withSecurity(
  req: NextApiRequest,
  res: NextApiResponse,
  options: {
    rateLimit?: { maxRequests: number }
    csrf?: boolean
    sanitizeInput?: boolean
    validateIP?: boolean
    setHeaders?: boolean
  } = {}
) {
  const {
    rateLimit = { maxRequests: 100 },
    csrf = false,
    sanitizeInput: shouldSanitize = true,
    validateIP: shouldValidateIP = true,
    setHeaders = true
  } = options

  // Set security headers
  if (setHeaders) {
    setSecurityHeaders(res)
  }

  // Validate IP
  if (shouldValidateIP && !validateIP(req)) {
    res.status(403).json({
      success: false,
      error: 'Access denied',
      code: 'ACCESS_DENIED'
    })
    return false
  }

  // Rate limiting
  if (rateLimit && !(await withRateLimit(req, res, rateLimit.maxRequests))) {
    return false
  }

  // CSRF protection
  if (csrf && !withCSRFProtection(req, res)) {
    return false
  }

  // Input sanitization
  if (shouldSanitize && req.body) {
    req.body = sanitizeInput(req.body)
  }

  return true
}