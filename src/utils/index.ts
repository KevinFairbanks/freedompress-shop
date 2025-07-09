import slugify from 'slugify'
import currency from 'currency.js'
import { ProductCreateInput, ProductUpdateInput } from '../types'

// Slug generation
export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  })
}

// Price formatting
export function formatPrice(amount: number, currencyCode: string = 'USD'): string {
  return currency(amount, {
    symbol: getCurrencySymbol(currencyCode),
    precision: 2
  }).format()
}

// Get currency symbol
export function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    SEK: 'kr',
    NZD: 'NZ$'
  }
  return symbols[currencyCode] || currencyCode
}

// Calculate discounted price
export function calculateDiscountedPrice(price: number, discountPercent: number): number {
  return currency(price).multiply(1 - discountPercent / 100).value
}

// Calculate tax
export function calculateTax(subtotal: number, taxRate: number): number {
  return currency(subtotal).multiply(taxRate).value
}

// Calculate shipping
export function calculateShipping(
  subtotal: number,
  shippingRate: number,
  freeShippingThreshold: number = 0
): number {
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
    return 0
  }
  return shippingRate
}

// Validate product data
export function validateProductData(data: ProductCreateInput | ProductUpdateInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Product name is required')
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Product description is required')
  }

  if (data.price === undefined || data.price === null) {
    errors.push('Product price is required')
  }

  // Validate name length
  if (data.name && data.name.length > 255) {
    errors.push('Product name must be less than 255 characters')
  }

  // Validate price
  if (data.price !== undefined && data.price < 0) {
    errors.push('Product price must be positive')
  }

  // Validate compare price
  if (data.comparePrice !== undefined && data.comparePrice < 0) {
    errors.push('Compare price must be positive')
  }

  // Validate cost price
  if (data.costPrice !== undefined && data.costPrice < 0) {
    errors.push('Cost price must be positive')
  }

  // Validate quantity
  if (data.quantity !== undefined && data.quantity < 0) {
    errors.push('Quantity must be non-negative')
  }

  // Validate weight and dimensions
  if (data.weight !== undefined && data.weight < 0) {
    errors.push('Weight must be non-negative')
  }

  if (data.length !== undefined && data.length < 0) {
    errors.push('Length must be non-negative')
  }

  if (data.width !== undefined && data.width < 0) {
    errors.push('Width must be non-negative')
  }

  if (data.height !== undefined && data.height < 0) {
    errors.push('Height must be non-negative')
  }

  // Validate SKU uniqueness (would need database check in real implementation)
  if (data.sku && data.sku.length > 100) {
    errors.push('SKU must be less than 100 characters')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Generate SKU
export function generateSKU(productName: string, variant?: string): string {
  const nameCode = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6)
  
  const variantCode = variant 
    ? variant.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3)
    : ''
  
  const timestamp = Date.now().toString().slice(-6)
  
  return `${nameCode}${variantCode}${timestamp}`
}

// Calculate inventory status
export function getInventoryStatus(product: {
  trackQuantity: boolean
  quantity: number
  lowStockLevel: number
}): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (!product.trackQuantity) {
    return 'in_stock'
  }
  
  if (product.quantity <= 0) {
    return 'out_of_stock'
  }
  
  if (product.quantity <= product.lowStockLevel) {
    return 'low_stock'
  }
  
  return 'in_stock'
}

// Format weight
export function formatWeight(weight: number, unit: string = 'kg'): string {
  const units: Record<string, string> = {
    kg: 'kg',
    g: 'g',
    lb: 'lb',
    oz: 'oz'
  }
  
  return `${weight} ${units[unit] || unit}`
}

// Format dimensions
export function formatDimensions(
  length: number,
  width: number,
  height: number,
  unit: string = 'cm'
): string {
  return `${length} × ${width} × ${height} ${unit}`
}

// Validate email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

// Validate ZIP code
export function validateZipCode(zipCode: string, country: string = 'US'): boolean {
  const zipRegexes: Record<string, RegExp> = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
    GB: /^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
    IT: /^\d{5}$/,
    ES: /^\d{5}$/,
    AU: /^\d{4}$/,
    NZ: /^\d{4}$/
  }
  
  const regex = zipRegexes[country.toUpperCase()]
  return regex ? regex.test(zipCode) : true // Default to valid for unknown countries
}

// Calculate order totals
export function calculateOrderTotals(items: Array<{
  price: number
  quantity: number
}>, taxRate: number = 0, shippingRate: number = 0, discountAmount: number = 0): {
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
} {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = calculateTax(subtotal, taxRate)
  const shipping = calculateShipping(subtotal, shippingRate)
  const discount = Math.min(discountAmount, subtotal) // Discount can't exceed subtotal
  const total = subtotal + tax + shipping - discount
  
  return {
    subtotal: currency(subtotal).value,
    tax: currency(tax).value,
    shipping: currency(shipping).value,
    discount: currency(discount).value,
    total: currency(total).value
  }
}

// Search products
export function searchProducts<T extends { name: string; description: string }>(
  products: T[],
  query: string
): T[] {
  if (!query.trim()) {
    return products
  }
  
  const searchTerm = query.toLowerCase().trim()
  
  return products.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description.toLowerCase().includes(searchTerm)
  )
}

// Sort products
export function sortProducts<T extends Record<string, any>>(
  products: T[],
  sortBy: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): T[] {
  return [...products].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' 
        ? aValue - bValue
        : bValue - aValue
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortOrder === 'asc' 
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime()
    }
    
    return 0
  })
}

// Filter products by price range
export function filterProductsByPrice<T extends { price: number }>(
  products: T[],
  minPrice?: number,
  maxPrice?: number
): T[] {
  return products.filter(product => {
    if (minPrice !== undefined && product.price < minPrice) return false
    if (maxPrice !== undefined && product.price > maxPrice) return false
    return true
  })
}

// Generate product variants
export function generateProductVariants(options: {
  [optionName: string]: string[]
}): Array<{
  option1Name?: string
  option1Value?: string
  option2Name?: string
  option2Value?: string
  option3Name?: string
  option3Value?: string
}> {
  const optionNames = Object.keys(options)
  const optionValues = Object.values(options)
  
  if (optionNames.length === 0) return []
  
  const variants: Array<{
    option1Name?: string
    option1Value?: string
    option2Name?: string
    option2Value?: string
    option3Name?: string
    option3Value?: string
  }> = []
  
  function generateCombinations(index: number, current: any) {
    if (index === optionNames.length) {
      variants.push(current)
      return
    }
    
    const optionName = optionNames[index]
    const values = optionValues[index]
    
    for (const value of values) {
      const variant: any = { ...current }
      
      if (index === 0) {
        variant.option1Name = optionName
        variant.option1Value = value
      } else if (index === 1) {
        variant.option2Name = optionName
        variant.option2Value = value
      } else if (index === 2) {
        variant.option3Name = optionName
        variant.option3Value = value
      }
      
      generateCombinations(index + 1, variant)
    }
  }
  
  generateCombinations(0, {})
  
  return variants
}

// Convert weight between units
export function convertWeight(weight: number, fromUnit: string, toUnit: string): number {
  const conversions: Record<string, number> = {
    g: 1,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592
  }
  
  const fromGrams = conversions[fromUnit] || 1
  const toGrams = conversions[toUnit] || 1
  
  return (weight * fromGrams) / toGrams
}

// Convert dimensions between units
export function convertDimensions(dimension: number, fromUnit: string, toUnit: string): number {
  const conversions: Record<string, number> = {
    mm: 1,
    cm: 10,
    m: 1000,
    in: 25.4,
    ft: 304.8
  }
  
  const fromMm = conversions[fromUnit] || 1
  const toMm = conversions[toUnit] || 1
  
  return (dimension * fromMm) / toMm
}

// Generate barcode (simple implementation)
export function generateBarcode(): string {
  // Generate a simple 13-digit barcode (EAN-13 format)
  let barcode = ''
  for (let i = 0; i < 12; i++) {
    barcode += Math.floor(Math.random() * 10)
  }
  
  // Calculate check digit
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }
  
  const checkDigit = (10 - (sum % 10)) % 10
  barcode += checkDigit
  
  return barcode
}

// Validate credit card number (basic Luhn algorithm)
export function validateCreditCard(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')
  
  if (digits.length < 13 || digits.length > 19) {
    return false
  }
  
  let sum = 0
  let shouldDouble = false
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i])
    
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    shouldDouble = !shouldDouble
  }
  
  return sum % 10 === 0
}

// Export utilities
export {
  currency,
  slugify
}