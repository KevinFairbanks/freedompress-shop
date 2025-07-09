# @freedompress/shop

A complete e-commerce module for FreedomPress - Modern CMS with comprehensive shopping features.

## Features

- ✅ **Product Management**: Products with variants, categories, and collections
- ✅ **Shopping Cart**: Persistent cart with session management
- ✅ **Checkout Process**: Secure checkout with multiple payment options
- ✅ **Order Management**: Complete order tracking and management
- ✅ **Inventory Tracking**: Real-time inventory management
- ✅ **Payment Integration**: Stripe, PayPal, and other payment processors
- ✅ **Shipping Calculations**: Flexible shipping rules and zones
- ✅ **Discount Codes**: Coupon and discount code system
- ✅ **Customer Accounts**: User profiles and order history
- ✅ **Reviews & Ratings**: Product reviews and ratings system
- ✅ **Analytics Ready**: Built-in sales tracking and metrics

## Installation

```bash
npm install @freedompress/shop @freedompress/core
```

## Quick Start

1. **Install the module**:
   ```bash
   npm install @freedompress/shop
   ```

2. **Add to your FreedomPress project**:
   ```javascript
   import { shopModule } from '@freedompress/shop'
   
   // Register the module
   await shopModule.install(context)
   await shopModule.activate(context)
   ```

3. **Use components in your app**:
   ```jsx
   import { ProductList, ProductCard } from '@freedompress/shop'
   
   function ShopPage() {
     return (
       <div>
         <h1>Shop</h1>
         <ProductList products={products} />
       </div>
     )
   }
   ```

## API Routes

The shop module provides the following API endpoints:

- `GET /api/shop/products` - Get all products with pagination
- `POST /api/shop/products` - Create a new product
- `GET /api/shop/products/[slug]` - Get a specific product
- `PUT /api/shop/products/[id]` - Update a product
- `DELETE /api/shop/products/[id]` - Delete a product
- `GET /api/shop/categories` - Get all categories
- `GET /api/shop/cart` - Get user's cart
- `POST /api/shop/cart/items` - Add item to cart
- `PUT /api/shop/cart/items/[id]` - Update cart item
- `DELETE /api/shop/cart/items/[id]` - Remove cart item
- `POST /api/shop/checkout` - Process checkout
- `GET /api/shop/orders` - Get user's orders
- `GET /api/shop/orders/[id]` - Get specific order

## Components

### ProductList
Display a list of products with pagination and filtering.

```jsx
import { ProductList } from '@freedompress/shop'

<ProductList 
  products={products}
  pagination={pagination}
  onLoadMore={handleLoadMore}
/>
```

### ProductCard
Display a single product in card format.

```jsx
import { ProductCard } from '@freedompress/shop'

<ProductCard 
  product={product}
  showAddToCart={true}
  showQuickView={true}
/>
```

### CartSidebar
Shopping cart sidebar component.

```jsx
import { CartSidebar } from '@freedompress/shop'

<CartSidebar 
  cart={cart}
  onUpdateQuantity={handleUpdateQuantity}
  onRemoveItem={handleRemoveItem}
/>
```

## Hooks

### useProducts
Hook for fetching and managing products.

```jsx
import { useProducts } from '@freedompress/shop'

function ShopPage() {
  const { products, loading, error } = useProducts({
    query: { category: 'electronics', limit: 12 }
  })
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return <ProductList products={products} />
}
```

### useCart
Hook for cart management.

```jsx
import { useCart } from '@freedompress/shop'

function CartPage() {
  const { cart, addItem, updateQuantity, removeItem } = useCart()
  
  return (
    <div>
      <h1>Shopping Cart</h1>
      {cart?.items.map(item => (
        <div key={item.id}>
          <span>{item.product.name}</span>
          <input 
            type="number" 
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
          />
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
    </div>
  )
}
```

## State Management

The shop module uses Zustand for state management:

```jsx
import { useCartStore } from '@freedompress/shop'

function ProductPage({ product }) {
  const { addItem, isLoading } = useCartStore()
  
  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      quantity: 1
    })
  }
  
  return (
    <button onClick={handleAddToCart} disabled={isLoading}>
      Add to Cart
    </button>
  )
}
```

## Configuration

The shop module can be configured with the following options:

```javascript
{
  currency: 'USD',
  taxRate: 0.08,
  shippingRate: 5.99,
  freeShippingThreshold: 50.00,
  enableReviews: true,
  enableWishlist: true,
  enableInventoryTracking: true,
  enableVariants: true,
  enableDigitalProducts: false,
  paymentMethods: ['stripe', 'paypal'],
  shippingMethods: ['standard', 'express'],
  enableGuestCheckout: true,
  enableBackorders: false,
  enableLoyaltyProgram: false
}
```

## Database Schema

The shop module uses the following database tables:

- `products` - Product catalog with variants and pricing
- `categories` - Product categories
- `collections` - Product collections
- `carts` - Shopping carts
- `cart_items` - Cart items
- `orders` - Customer orders
- `order_items` - Order line items
- `product_reviews` - Product reviews and ratings
- `addresses` - Customer addresses
- `discount_codes` - Discount and coupon codes

## Payment Integration

### Stripe Setup
```javascript
// Add to your environment variables
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

// Configure in your app
import { configurePayment } from '@freedompress/shop'

configurePayment({
  provider: 'stripe',
  publicKey: process.env.STRIPE_PUBLIC_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY
})
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support, please visit our [GitHub Issues](https://github.com/KevinFairbanks/freedompress-shop/issues) page.