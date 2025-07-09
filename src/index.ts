import { ModuleInterface } from '@freedompress/core'

// Shop Module Configuration
export const shopModule: ModuleInterface = {
  config: {
    name: 'shop',
    version: '1.0.0',
    description: 'Complete shop solution for FreedomPress',
    author: 'FreedomPress Team',
    requires: {
      core: '^1.0.0'
    }
  },
  
  exports: {
    models: {
      Product: () => import('./models/Product'),
      ProductVariant: () => import('./models/ProductVariant'),
      Category: () => import('./models/Category'),
      Cart: () => import('./models/Cart'),
      Order: () => import('./models/Order'),
      Customer: () => import('./models/Customer')
    },
    api: {
      '/api/shop/products': () => import('./api/products'),
      '/api/shop/categories': () => import('./api/categories'),
      '/api/shop/cart': () => import('./api/cart'),
      '/api/shop/checkout': () => import('./api/checkout'),
      '/api/shop/orders': () => import('./api/orders'),
      '/api/shop/customers': () => import('./api/customers'),
      '/api/shop/payments': () => import('./api/payments')
    },
    pages: {
      '/shop': () => import('./pages/shop'),
      '/shop/product/[slug]': () => import('./pages/shop/product/[slug]'),
      '/shop/category/[slug]': () => import('./pages/shop/category/[slug]'),
      '/shop/cart': () => import('./pages/shop/cart'),
      '/shop/checkout': () => import('./pages/shop/checkout'),
      '/shop/account': () => import('./pages/shop/account'),
      '/shop/orders': () => import('./pages/shop/orders')
    },
    components: {
      ProductList: () => import('./components/ProductList'),
      ProductCard: () => import('./components/ProductCard'),
      ProductDetail: () => import('./components/ProductDetail'),
      ShoppingCart: () => import('./components/ShoppingCart'),
      CheckoutForm: () => import('./components/CheckoutForm'),
      OrderHistory: () => import('./components/OrderHistory')
    },
    hooks: {
      useProducts: () => import('./hooks/useProducts'),
      useCart: () => import('./hooks/useCart'),
      useCheckout: () => import('./hooks/useCheckout'),
      useOrders: () => import('./hooks/useOrders')
    },
    stores: {
      cartStore: () => import('./stores/cartStore'),
      checkoutStore: () => import('./stores/checkoutStore')
    },
    utils: {
      formatPrice: () => import('./utils/formatPrice'),
      calculateTax: () => import('./utils/calculateTax'),
      calculateShipping: () => import('./utils/calculateShipping'),
      validateAddress: () => import('./utils/validateAddress')
    }
  },

  async install(context) {
    // Installing shop module
    
    // Add shop-specific settings
    await context.prisma.setting.createMany({
      data: [
        { key: 'shop_currency', value: 'USD', category: 'shop' },
        { key: 'shop_tax_rate', value: '0.08', category: 'shop' },
        { key: 'shop_shipping_rate', value: '10.00', category: 'shop' },
        { key: 'shop_free_shipping_threshold', value: '100.00', category: 'shop' },
        { key: 'shop_stripe_public_key', value: '', category: 'shop' },
        { key: 'shop_stripe_secret_key', value: '', category: 'shop' },
        { key: 'shop_inventory_tracking', value: 'true', category: 'shop' },
        { key: 'shop_allow_backorders', value: 'false', category: 'shop' }
      ],
      skipDuplicates: true
    })
    
    // Shop module installed successfully
  },

  async activate(context) {
    // Activating shop module
    
    // Register shop routes
    context.events.emit('module:routes:register', {
      module: 'shop',
      routes: Object.keys(this.exports.api || {})
    })
    
    // Register shop pages
    context.events.emit('module:pages:register', {
      module: 'shop',
      pages: Object.keys(this.exports.pages || {})
    })
    
    // Initialize payment processing
    context.events.emit('module:payment:initialize', {
      module: 'shop',
      provider: 'stripe'
    })
    
    // Shop module activated successfully
  },

  async deactivate(context) {
    // Deactivating shop module
    
    // Unregister routes and pages
    context.events.emit('module:routes:unregister', { module: 'shop' })
    context.events.emit('module:pages:unregister', { module: 'shop' })
    
    // Shop module deactivated successfully
  },

  getDefaultConfig() {
    return {
      currency: 'USD',
      taxRate: 0.08,
      shippingRate: 10.00,
      freeShippingThreshold: 100.00,
      inventoryTracking: true,
      allowBackorders: false,
      requireShippingAddress: true,
      enableGuestCheckout: true,
      enableProductReviews: true,
      enableWishlist: true,
      enableCompareProducts: false,
      maxCartItems: 99,
      sessionTimeout: 30 * 60 * 1000 // 30 minutes
    }
  },

  validateConfig(config) {
    const requiredFields = ['currency', 'taxRate', 'shippingRate']
    for (const field of requiredFields) {
      if (!(field in config)) {
        return false
      }
    }
    
    // Validate currency format
    if (typeof config.currency !== 'string' || config.currency.length !== 3) {
      return false
    }
    
    // Validate rates are numbers
    if (typeof config.taxRate !== 'number' || typeof config.shippingRate !== 'number') {
      return false
    }
    
    return true
  }
}

export default shopModule

// Export types for TypeScript support
export * from './types'
export * from './hooks'
export * from './stores'
export * from './utils'