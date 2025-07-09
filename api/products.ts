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

// GET /api/shop/products - Get all products with pagination and filtering
async function getProducts(req: NextApiRequest, res: NextApiResponse) {
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

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {}
    
    // Only show active products for non-authenticated users
    const session = await getSession({ req })
    if (!session?.user || session.user.role !== 'admin') {
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
      if (minPrice) where.price.gte = parseFloat(minPrice as string)
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string)
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

    // Build order clause
    const orderBy: any = {}
    if (sortBy === 'price') {
      orderBy.price = sortOrder
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else {
      orderBy[sortBy as string] = sortOrder
    }

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
    console.error('Error fetching products:', error)
    return errorResponse(res, 'Failed to fetch products', 500)
  }
}

// POST /api/shop/products - Create a new product
async function createProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession({ req })
    if (!session?.user || session.user.role !== 'admin') {
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
    console.error('Error creating product:', error)
    return errorResponse(res, 'Failed to create product', 500)
  }
}

// PUT /api/shop/products/[id] - Update a product
async function updateProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession({ req })
    if (!session?.user || session.user.role !== 'admin') {
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
    console.error('Error updating product:', error)
    return errorResponse(res, 'Failed to update product', 500)
  }
}

// DELETE /api/shop/products/[id] - Delete a product
async function deleteProduct(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession({ req })
    if (!session?.user || session.user.role !== 'admin') {
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
    console.error('Error deleting product:', error)
    return errorResponse(res, 'Failed to delete product', 500)
  }
}

// GET /api/shop/products/[slug] - Get single product by slug
async function getProductBySlug(req: NextApiRequest, res: NextApiResponse) {
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
    if (product.status !== ProductStatus.ACTIVE && (!session?.user || session.user.role !== 'admin')) {
      return errorResponse(res, 'Product not found', 404)
    }

    const response: ShopApiResponse<Product> = {
      success: true,
      data: product as Product
    }

    return successResponse(res, response.data)
  } catch (error) {
    console.error('Error fetching product:', error)
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