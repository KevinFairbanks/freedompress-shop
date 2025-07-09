import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ProductCardProps } from '../src/types'
import { formatPrice, getInventoryStatus } from '../src/utils'

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showAddToCart = true,
  showQuickView = false,
  className = ''
}) => {
  const inventoryStatus = getInventoryStatus(product)
  const isOutOfStock = inventoryStatus === 'out_of_stock'
  const isLowStock = inventoryStatus === 'low_stock'
  
  const handleAddToCart = () => {
    // This would typically dispatch to a cart store
    // TODO: Implement cart store integration
  }

  const handleQuickView = () => {
    // This would typically open a modal
    // TODO: Implement quick view modal
  }

  return (
    <div className={`group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}>
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden">
        <Link href={`/shop/product/${product.slug}`}>
          <Image
            src={product.images?.[0]?.url || '/placeholder-product.jpg'}
            alt={product.images?.[0]?.altText || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </Link>
        
        {/* Product Badges */}
        <div className="absolute top-2 left-2 space-y-1">
          {product.featured && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              Featured
            </span>
          )}
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
              Sale
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              Out of Stock
            </span>
          )}
          {isLowStock && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
              Low Stock
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-y-1">
          {showQuickView && (
            <button
              onClick={handleQuickView}
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow duration-200"
              title="Quick View"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          )}
          <button
            className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow duration-200"
            title="Add to Wishlist"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category */}
        {product.category && (
          <div className="mb-2">
            <Link
              href={`/shop/category/${product.category.slug}`}
              className="text-xs font-medium text-gray-500 hover:text-primary-600 transition-colors uppercase tracking-wide"
            >
              {product.category.name}
            </Link>
          </div>
        )}

        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          <Link
            href={`/shop/product/${product.slug}`}
            className="hover:text-primary-600 transition-colors"
          >
            {product.name}
          </Link>
        </h3>

        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {product.shortDescription}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>
          
          {/* Savings */}
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs font-medium text-green-600">
              Save {formatPrice(product.comparePrice - product.price)}
            </span>
          )}
        </div>

        {/* Product Variants Preview */}
        {product.hasVariants && product.variants && product.variants.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Colors:</span>
              <div className="flex space-x-1">
                {product.variants.slice(0, 3).map((variant, index) => (
                  <div
                    key={variant.id}
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: variant.option1Value?.toLowerCase() || '#ccc' }}
                    title={variant.option1Value}
                  />
                ))}
                {product.variants.length > 3 && (
                  <span className="text-xs text-gray-500">+{product.variants.length - 3}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-3 h-3 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-2">
            ({(product as any)._count?.reviews || 0} reviews)
          </span>
        </div>

        {/* Add to Cart Button */}
        {showAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductCard