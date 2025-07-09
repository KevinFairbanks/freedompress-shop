// Product Types
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  
  // Pricing
  price: number
  comparePrice?: number
  costPrice?: number
  
  // Inventory
  sku?: string
  barcode?: string
  trackQuantity: boolean
  quantity: number
  lowStockLevel: number
  
  // Status
  status: ProductStatus
  featured: boolean
  
  // SEO
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  
  // Shipping
  weight?: number
  length?: number
  width?: number
  height?: number
  requiresShipping: boolean
  
  // Variants
  hasVariants: boolean
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  categoryId?: string
  category?: Category
  collections: ProductCollection[]
  variants: ProductVariant[]
  images: ProductImage[]
  reviews: ProductReview[]
  tags: ProductTag[]
}

export interface ProductVariant {
  id: string
  productId: string
  
  // Basic info
  name: string
  sku?: string
  barcode?: string
  
  // Pricing
  price: number
  comparePrice?: number
  costPrice?: number
  
  // Inventory
  quantity: number
  trackQuantity: boolean
  
  // Options
  option1Name?: string
  option1Value?: string
  option2Name?: string
  option2Value?: string
  option3Name?: string
  option3Value?: string
  
  // Physical properties
  weight?: number
  length?: number
  width?: number
  height?: number
  
  // Status
  status: ProductStatus
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  product: Product
  images: ProductImage[]
}

export interface ProductImage {
  id: string
  url: string
  altText?: string
  position: number
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  productId?: string
  product?: Product
  variantId?: string
  variant?: ProductVariant
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  
  // SEO
  metaTitle?: string
  metaDescription?: string
  
  // Media
  image?: string
  imageAlt?: string
  
  // Hierarchy
  parentId?: string
  parent?: Category
  children: Category[]
  
  // Display
  featured: boolean
  sortOrder: number
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  products: Product[]
}

export interface Collection {
  id: string
  name: string
  slug: string
  description?: string
  
  // SEO
  metaTitle?: string
  metaDescription?: string
  
  // Media
  image?: string
  imageAlt?: string
  
  // Display
  featured: boolean
  sortOrder: number
  
  // Rules for automatic collection
  rules?: any
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  products: ProductCollection[]
}

export interface ProductCollection {
  productId: string
  collectionId: string
  product: Product
  collection: Collection
}

export interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  products: ProductTag[]
}

export interface ProductTag {
  productId: string
  tagId: string
  product: Product
  tag: Tag
}

export interface Cart {
  id: string
  sessionId?: string
  
  // Totals
  subtotal: number
  tax: number
  shipping: number
  total: number
  
  // Discounts
  discountCode?: string
  discountAmount: number
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  userId?: string
  user?: User
  items: CartItem[]
}

export interface CartItem {
  id: string
  quantity: number
  price: number
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  cartId: string
  cart: Cart
  productId: string
  product: Product
  variantId?: string
  variant?: ProductVariant
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  
  // Customer info
  email: string
  phone?: string
  
  // Pricing
  subtotal: number
  tax: number
  shipping: number
  total: number
  discountAmount: number
  discountCode?: string
  
  // Addresses
  shippingAddress: Address
  billingAddress: Address
  
  // Payment
  paymentStatus: PaymentStatus
  paymentMethod?: string
  paymentId?: string
  
  // Shipping
  shippingMethod?: string
  trackingNumber?: string
  
  // Notes
  notes?: string
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  userId?: string
  user?: User
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  quantity: number
  price: number
  total: number
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  orderId: string
  order: Order
  productId: string
  product: Product
  variantId?: string
  variant?: ProductVariant
}

export interface ProductReview {
  id: string
  rating: number
  title?: string
  content: string
  
  // Verification
  verified: boolean
  approved: boolean
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  productId: string
  product: Product
  userId: string
  user: User
}

export interface Address {
  id: string
  type: AddressType
  
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  country: string
  zipCode: string
  phone?: string
  
  isDefault: boolean
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  userId: string
  user: User
}

export interface DiscountCode {
  id: string
  code: string
  type: DiscountType
  value: number
  minAmount?: number
  maxAmount?: number
  
  // Usage limits
  usageLimit?: number
  usageCount: number
  
  // Validity
  startsAt?: Date
  expiresAt?: Date
  active: boolean
  
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  name?: string
  email: string
  emailVerified?: Date
  image?: string
  
  // Shop-specific fields
  phone?: string
  dateOfBirth?: Date
  
  // Preferences
  marketingEmails: boolean
  currency: string
  
  // Loyalty
  loyaltyPoints: number
  
  createdAt: Date
  updatedAt: Date
  
  // Relations
  carts: Cart[]
  orders: Order[]
  reviews: ProductReview[]
  addresses: Address[]
}

// Enums
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED'
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING'
}

export enum AddressType {
  SHIPPING = 'SHIPPING',
  BILLING = 'BILLING'
}

// Input Types
export interface ProductCreateInput {
  name: string
  description: string
  shortDescription?: string
  price: number
  comparePrice?: number
  costPrice?: number
  sku?: string
  barcode?: string
  trackQuantity?: boolean
  quantity?: number
  lowStockLevel?: number
  status?: ProductStatus
  featured?: boolean
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  weight?: number
  length?: number
  width?: number
  height?: number
  requiresShipping?: boolean
  categoryId?: string
  collections?: string[]
  tags?: string[]
  images?: ProductImageInput[]
}

export interface ProductUpdateInput extends Partial<ProductCreateInput> {
  id: string
}

export interface ProductImageInput {
  url: string
  altText?: string
  position?: number
}

export interface CartItemInput {
  productId: string
  variantId?: string
  quantity: number
}

export interface OrderCreateInput {
  email: string
  phone?: string
  shippingAddress: AddressInput
  billingAddress: AddressInput
  paymentMethod: string
  notes?: string
}

export interface AddressInput {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  country: string
  zipCode: string
  phone?: string
}

// API Response Types
export interface ShopApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Query Types
export interface ProductQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  collection?: string
  tag?: string
  status?: ProductStatus
  featured?: boolean
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface OrderQuery {
  page?: number
  limit?: number
  search?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  startDate?: Date
  endDate?: Date
  sortBy?: 'orderNumber' | 'createdAt' | 'total'
  sortOrder?: 'asc' | 'desc'
}

// Component Props Types
export interface ProductListProps {
  products: Product[]
  loading?: boolean
  error?: string
  pagination?: PaginatedResponse<Product>['pagination']
  onLoadMore?: () => void
}

export interface ProductCardProps {
  product: Product
  showAddToCart?: boolean
  showQuickView?: boolean
  className?: string
}

export interface CartProps {
  cart: Cart
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onCheckout: () => void
  loading?: boolean
}

export interface CheckoutProps {
  cart: Cart
  onSubmit: (data: OrderCreateInput) => void
  loading?: boolean
  error?: string
}

// Hook Types
export interface UseProductsOptions {
  query?: ProductQuery
  enabled?: boolean
  onError?: (error: Error) => void
}

export interface UseCartOptions {
  enabled?: boolean
  onError?: (error: Error) => void
}

export interface UseOrdersOptions {
  query?: OrderQuery
  enabled?: boolean
  onError?: (error: Error) => void
}

// Store Types (for Zustand)
export interface CartStore {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchCart: () => Promise<void>
  addItem: (item: CartItemInput) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  applyDiscount: (code: string) => Promise<void>
  removeDiscount: () => Promise<void>
}

export interface ProductStore {
  products: Product[]
  currentProduct: Product | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchProducts: (query?: ProductQuery) => Promise<void>
  fetchProduct: (slug: string) => Promise<void>
  clearCurrentProduct: () => void
}

// Shop Configuration Types
export interface ShopConfig {
  currency: string
  taxRate: number
  shippingRate: number
  freeShippingThreshold: number
  enableReviews: boolean
  enableWishlist: boolean
  enableInventoryTracking: boolean
  enableVariants: boolean
  enableDigitalProducts: boolean
  paymentMethods: string[]
  shippingMethods: string[]
}

// Payment Types
export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  clientSecret: string
}

export interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
}

// Shipping Types
export interface ShippingRate {
  id: string
  name: string
  price: number
  estimatedDays: number
}

export interface ShippingZone {
  id: string
  name: string
  countries: string[]
  rates: ShippingRate[]
}

// Analytics Types
export interface ProductAnalytics {
  views: number
  addToCart: number
  purchases: number
  revenue: number
  conversionRate: number
}

export interface OrderAnalytics {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  topProducts: Array<{
    product: Product
    quantity: number
    revenue: number
  }>
}