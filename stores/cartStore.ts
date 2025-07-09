import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { CartStore, Cart, CartItemInput } from '../src/types'
import { generateCSRFToken } from '../src/middleware/security'

// Helper function to get CSRF token
const getCSRFToken = async (): Promise<string> => {
  try {
    return generateCSRFToken()
  } catch (error) {
    console.error('Failed to generate CSRF token:', error)
    throw new Error('Security configuration error')
  }
}

// API functions (would typically be in a separate API client)
const cartApi = {
  async getCart(): Promise<Cart> {
    const response = await fetch('/api/shop/cart')
    if (!response.ok) {
      throw new Error('Failed to fetch cart')
    }
    return response.json()
  },

  async addItem(item: CartItemInput): Promise<Cart> {
    const csrfToken = await getCSRFToken()
    const response = await fetch('/api/shop/cart/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(item),
    })
    if (!response.ok) {
      throw new Error('Failed to add item to cart')
    }
    return response.json()
  },

  async updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    const csrfToken = await getCSRFToken()
    const response = await fetch(`/api/shop/cart/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ quantity }),
    })
    if (!response.ok) {
      throw new Error('Failed to update item quantity')
    }
    return response.json()
  },

  async removeItem(itemId: string): Promise<Cart> {
    const csrfToken = await getCSRFToken()
    const response = await fetch(`/api/shop/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to remove item from cart')
    }
    return response.json()
  },

  async clearCart(): Promise<void> {
    const csrfToken = await getCSRFToken()
    const response = await fetch('/api/shop/cart', {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to clear cart')
    }
  },

  async applyDiscount(code: string): Promise<Cart> {
    const csrfToken = await getCSRFToken()
    const response = await fetch('/api/shop/cart/discount', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ code }),
    })
    if (!response.ok) {
      throw new Error('Failed to apply discount')
    }
    return response.json()
  },

  async removeDiscount(): Promise<Cart> {
    const csrfToken = await getCSRFToken()
    const response = await fetch('/api/shop/cart/discount', {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to remove discount')
    }
    return response.json()
  },
}

export const useCartStore = create<CartStore>()(
  immer((set, get) => ({
    cart: null,
    isLoading: false,
    error: null,

    // Fetch cart
    fetchCart: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const cart = await cartApi.getCart()
        set((state) => {
          state.cart = cart
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch cart'
          state.isLoading = false
        })
      }
    },

    // Add item to cart
    addItem: async (item: CartItemInput) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const cart = await cartApi.addItem(item)
        set((state) => {
          state.cart = cart
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to add item to cart'
          state.isLoading = false
        })
      }
    },

    // Update item quantity
    updateQuantity: async (itemId: string, quantity: number) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        if (quantity <= 0) {
          await get().removeItem(itemId)
          return
        }

        const cart = await cartApi.updateQuantity(itemId, quantity)
        set((state) => {
          state.cart = cart
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update item quantity'
          state.isLoading = false
        })
      }
    },

    // Remove item from cart
    removeItem: async (itemId: string) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const cart = await cartApi.removeItem(itemId)
        set((state) => {
          state.cart = cart
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to remove item from cart'
          state.isLoading = false
        })
      }
    },

    // Clear cart
    clearCart: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        await cartApi.clearCart()
        set((state) => {
          state.cart = null
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to clear cart'
          state.isLoading = false
        })
      }
    },

    // Apply discount
    applyDiscount: async (code: string) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const cart = await cartApi.applyDiscount(code)
        set((state) => {
          state.cart = cart
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to apply discount'
          state.isLoading = false
        })
      }
    },

    // Remove discount
    removeDiscount: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const cart = await cartApi.removeDiscount()
        set((state) => {
          state.cart = cart
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to remove discount'
          state.isLoading = false
        })
      }
    },
  }))
)

// Selectors
export const useCart = () => useCartStore((state) => state.cart)
export const useCartItems = () => useCartStore((state) => state.cart?.items || [])
export const useCartTotal = () => useCartStore((state) => state.cart?.total || 0)
export const useCartItemCount = () => useCartStore((state) => 
  state.cart?.items.reduce((total, item) => total + item.quantity, 0) || 0
)
export const useCartLoading = () => useCartStore((state) => state.isLoading)
export const useCartError = () => useCartStore((state) => state.error)

// Actions
export const useCartActions = () => useCartStore((state) => ({
  fetchCart: state.fetchCart,
  addItem: state.addItem,
  updateQuantity: state.updateQuantity,
  removeItem: state.removeItem,
  clearCart: state.clearCart,
  applyDiscount: state.applyDiscount,
  removeDiscount: state.removeDiscount,
}))

export default useCartStore