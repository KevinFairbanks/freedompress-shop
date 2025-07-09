import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@freedompress/core'
import { createApiHandler, successResponse, errorResponse } from '@freedompress/core'
import { 
  ProductCreateInput, 
  ProductUpdateInput, 
  ProductQuery, 
  ShopApiResponse, 
  PaginatedResponse, 
  Product,
  ProductStatus 
} from '../src/types'
import { generateSlug, validateProductData, calculateDiscountedPrice } from '../src/utils'
import { withSecurity } from '../src/middleware/security'

// GET /api/shop/products - Get all products with pagination and filtering
async function getProducts(req: NextApiRequest, res: NextApiResponse) {
  // Apply security middleware
  const securityPassed = await withSecurity(req, res, {
    rateLimit: { maxRequests: 100 },
    csrf: false, // GET requests don't need CSRF protection
    sanitizeInput: true,
    validateIP: true,
    setHeaders: true
  })
  
  if (!securityPassed) {
    return // Security middleware already sent the response
  }

  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      collection,
      tag,
      status,
      featured,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query as ProductQuery

    // Validate and sanitize pagination parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 12))
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {}
    
    // Only show active products for non-authenticated users
    const session = await getSession({ req })
    let isAdmin = false
    
    if (session?.user) {
      // Get user from database to verify role (don't trust client session)
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true }
      })
      isAdmin = user?.role === 'admin'
    }
    
    if (!isAdmin) {
      where.status = ProductStatus.ACTIVE
    } else if (status) {
      where.status = status
    }
    
    if (featured !== undefined) {
      where.featured = featured === 'true'
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { shortDescription: { contains: search as string, mode: 'insensitive' } }
      ]
    }
    
    if (category) {
      where.category = {
        slug: category as string
      }
    }
    
    if (collection) {
      where.collections = {
        some: {
          collection: {
            slug: collection as string
          }
        }
      }
    }
    
    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag as string
          }
        }
      }
    }
    
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) {
        const minPriceNum = parseFloat(minPrice as string)
        if (!isNaN(minPriceNum) && minPriceNum >= 0) {
          where.price.gte = minPriceNum
        }
      }
      if (maxPrice) {
        const maxPriceNum = parseFloat(maxPrice as string)
        if (!isNaN(maxPriceNum) && maxPriceNum >= 0) {
          where.price.lte = maxPriceNum
        }
      }
    }
    
    if (inStock === 'true') {
      where.OR = [
        { trackQuantity: false },
        { 
          trackQuantity: true,
          quantity: { gt: 0 }
        }
      ]
    }

    // Build order clause with SQL injection protection
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'price', 'featured', 'status']
    const allowedSortOrders = ['asc', 'desc']
    
    const safeSortBy = allowedSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt'
    const safeSortOrder = allowedSortOrders.includes(sortOrder as string) ? sortOrder as string : 'desc'
    
    const orderBy: any = {}
    orderBy[safeSortBy] = safeSortOrder

    // Get products with relations
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          collections: {
            include: {
              collection: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          images: {
            orderBy: {
              position: 'asc'
            }
          },
          variants: {
            where: {
              status: ProductStatus.ACTIVE
            },
            include: {
              images: {
                orderBy: {
                  position: 'asc'
                }
              }
            }
          },
          _count: {
            select: {
              reviews: true
            }
          }
        },
        orderBy,
        skip,
        take: limitNum
      }),
      prisma.product.count({ where })
    ])

    const totalPages = Math.ceil(total / limitNum)

    const response: ShopApiResponse<PaginatedResponse<Product>> = {
      success: true,
      data: {
        data: products as Product[],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    }

    return successResponse(res, response.data)
  } catch (error) {
    // Log error securely without exposing sensitive data
    console.error('Error fetching products:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    })
    return errorResponse(res, 'Failed to fetch products', 500)
  }
}

// POST /api/shop/products - Create a new product
async function createProduct(req: NextApiRequest, res: NextApiResponse) {
  // Apply security middleware with CSRF protection
  const securityPassed = await withSecurity(req, res, {
    rateLimit: { maxRequests: 20 }, // Stricter rate limit for POST requests
    csrf: true, // POST requests need CSRF protection
    sanitizeInput: true,
    validateIP: true,
    setHeaders: true
  })
  
  if (!securityPassed) {
    return // Security middleware already sent the response
  }

  try {
    const session = await getSession({ req })
    if (!session?.user) {
      return errorResponse(res, 'Unauthorized', 401)
    }

    // Get user from database to verify role (don't trust client session)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    })

    if (!user || user.role !== 'admin') {
      return errorResponse(res, 'Unauthorized', 401)
    }

    const productData = req.body as ProductCreateInput
    
    // Validate input
    const validation = validateProductData(productData)
    if (!validation.valid) {
      return errorResponse(res, 'Invalid product data', 400, validation.errors)
    }

    // Generate slug if not provided
    const slug = productData.slug || generateSlug(productData.name)
    
    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug }
    })
    
    if (existingProduct) {
      return errorResponse(res, 'Product with this slug already exists', 400)
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug,
        description: productData.description,
        shortDescription: productData.shortDescription,
        price: productData.price,
        comparePrice: productData.comparePrice,
        costPrice: productData.costPrice,
        sku: productData.sku,
        barcode: productData.barcode,
        trackQuantity: productData.trackQuantity ?? true,
        quantity: productData.quantity ?? 0,
        lowStockLevel: productData.lowStockLevel ?? 10,
        status: productData.status ?? ProductStatus.ACTIVE,
        featured: productData.featured ?? false,
        metaTitle: productData.metaTitle,
        metaDescription: productData.metaDescription,
        metaKeywords: productData.metaKeywords,
        weight: productData.weight,
        length: productData.length,
        width: productData.width,
        height: productData.height,
        requiresShipping: productData.requiresShipping ?? true,
        categoryId: productData.categoryId,
        collections: {
          create: productData.collections?.map(collectionId => ({
            collectionId
          })) || []
        },
        tags: {
          create: productData.tags?.map(tagId => ({
            tagId
          })) || []
        },
        images: {
          create: productData.images?.map((image, index) => ({
            url: image.url,
            altText: image.altText,
            position: image.position ?? index
          })) || []
        }
      },
      include: {
        category: true,
        collections: {
          include: {
            collection: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        images: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    })

    const response: ShopApiResponse<Product> = {
      success: true,
      data: product as Product,
      message: 'Product created successfully'
    }

    return successResponse(res, response.data, 201)
  } catch (error) {
    // Log error securely without exposing sensitive data
    console.error('Error creating product:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    })
    return errorResponse(res, 'Failed to create product', 500)
  }
}

// PUT /api/shop/products/[id] - Update a product
async function updateProduct(req: NextApiRequest, res: NextApiResponse) {
  // Apply security middleware with CSRF protection
  const securityPassed = await withSecurity(req, res, {
    rateLimit: { maxRequests: 20 }, // Stricter rate limit for PUT requests
    csrf: true, // PUT requests need CSRF protection
    sanitizeInput: true,
    validateIP: true,
    setHeaders: true
  })
  
  if (!securityPassed) {
    return // Security middleware already sent the response
  }

  try {
    const session = await getSession({ req })
    if (!session?.user) {
      return errorResponse(res, 'Unauthorized', 401)
    }

    // Get user from database to verify role (don't trust client session)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    })

    if (!user || user.role !== 'admin') {
      return errorResponse(res, 'Unauthorized', 401)
    }

    const { id } = req.query
    const productData = req.body as ProductUpdateInput

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: id as string }
    })

    if (!existingProduct) {
      return errorResponse(res, 'Product not found', 404)
    }

    // Validate input
    const validation = validateProductData(productData)
    if (!validation.valid) {
      return errorResponse(res, 'Invalid product data', 400, validation.errors)
    }

    // Generate slug if name changed
    let slug = existingProduct.slug
    if (productData.name && productData.name !== existingProduct.name) {
      slug = generateSlug(productData.name)
      
      // Check if new slug already exists
      const slugExists = await prisma.product.findUnique({
        where: { slug, NOT: { id: id as string } }
      })
      
      if (slugExists) {
        return errorResponse(res, 'Product with this slug already exists', 400)
      }
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: id as string },
      data: {
        name: productData.name,
        slug,
        description: productData.description,
        shortDescription: productData.shortDescription,
        price: productData.price,
        comparePrice: productData.comparePrice,
        costPrice: productData.costPrice,
        sku: productData.sku,
        barcode: productData.barcode,
        trackQuantity: productData.trackQuantity,
        quantity: productData.quantity,
        lowStockLevel: productData.lowStockLevel,
        status: productData.status,
        featured: productData.featured,
        metaTitle: productData.metaTitle,
        metaDescription: productData.metaDescription,
        metaKeywords: productData.metaKeywords,
        weight: productData.weight,
        length: productData.length,
        width: productData.width,
        height: productData.height,
        requiresShipping: productData.requiresShipping,
        categoryId: productData.categoryId,
        collections: productData.collections ? {
          deleteMany: {},
          create: productData.collections.map(collectionId => ({
            collectionId
          }))
        } : undefined,
        tags: productData.tags ? {
          deleteMany: {},
          create: productData.tags.map(tagId => ({
            tagId
          }))
        } : undefined,
        images: productData.images ? {
          deleteMany: {},
          create: productData.images.map((image, index) => ({
            url: image.url,
            altText: image.altText,
            position: image.position ?? index
          }))
        } : undefined
      },
      include: {
        category: true,
        collections: {
          include: {
            collection: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        images: {
          orderBy: {
            position: 'asc'
          }
        }
      }
    })

    const response: ShopApiResponse<Product> = {
      success: true,
      data: updatedProduct as Product,
      message: 'Product updated successfully'
    }

    return successResponse(res, response.data)
  } catch (error) {
    // Log error securely without exposing sensitive data
    console.error('Error updating product:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    })
    return errorResponse(res, 'Failed to update product', 500)
  }
}

// DELETE /api/shop/products/[id] - Delete a product
async function deleteProduct(req: NextApiRequest, res: NextApiResponse) {
  // Apply security middleware with CSRF protection
  const securityPassed = await withSecurity(req, res, {
    rateLimit: { maxRequests: 10 }, // Very strict rate limit for DELETE requests
    csrf: true, // DELETE requests need CSRF protection
    sanitizeInput: true,
    validateIP: true,
    setHeaders: true
  })
  
  if (!securityPassed) {
    return // Security middleware already sent the response
  }

  try {
    const session = await getSession({ req })
    if (!session?.user) {
      return errorResponse(res, 'Unauthorized', 401)
    }

    // Get user from database to verify role (don't trust client session)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    })

    if (!user || user.role !== 'admin') {
      return errorResponse(res, 'Unauthorized', 401)
    }

    const { id } = req.query

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: id as string }
    })

    if (!existingProduct) {
      return errorResponse(res, 'Product not found', 404)
    }

    // Delete product (cascade will handle related data)
    await prisma.product.delete({
      where: { id: id as string }
    })

    const response: ShopApiResponse = {
      success: true,
      message: 'Product deleted successfully'
    }

    return successResponse(res, response)
  } catch (error) {
    // Log error securely without exposing sensitive data
    console.error('Error deleting product:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    })
    return errorResponse(res, 'Failed to delete product', 500)
  }
}

// GET /api/shop/products/[slug] - Get single product by slug
async function getProductBySlug(req: NextApiRequest, res: NextApiResponse) {
  // Apply security middleware
  const securityPassed = await withSecurity(req, res, {
    rateLimit: { maxRequests: 200 }, // Higher rate limit for individual product views
    csrf: false, // GET requests don't need CSRF protection
    sanitizeInput: true,
    validateIP: true,
    setHeaders: true
  })
  
  if (!securityPassed) {
    return // Security middleware already sent the response
  }

  try {
    const { slug } = req.query

    const product = await prisma.product.findUnique({
      where: { slug: slug as string },
      include: {
        category: true,
        collections: {
          include: {
            collection: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        images: {
          orderBy: {
            position: 'asc'
          }
        },
        variants: {
          where: {
            status: ProductStatus.ACTIVE
          },
          include: {
            images: {
              orderBy: {
                position: 'asc'
              }
            }
          }
        },
        reviews: {
          where: {
            approved: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!product) {
      return errorResponse(res, 'Product not found', 404)
    }

    // Only show active products for non-authenticated users
    const session = await getSession({ req })
    if (product.status !== ProductStatus.ACTIVE) {
      let isAdmin = false
      
      if (session?.user) {
        // Get user from database to verify role (don't trust client session)
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, role: true }
        })
        isAdmin = user?.role === 'admin'
      }
      
      if (!isAdmin) {
        return errorResponse(res, 'Product not found', 404)
      }
    }

    const response: ShopApiResponse<Product> = {
      success: true,
      data: product as Product
    }

    return successResponse(res, response.data)
  } catch (error) {
    // Log error securely without exposing sensitive data
    console.error('Error fetching product:', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    })
    return errorResponse(res, 'Failed to fetch product', 500)
  }
}

// Main API handler
export default createApiHandler({
  GET: getProducts,
  POST: createProduct
})

// Export individual handlers for dynamic routes
export {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductBySlug
}