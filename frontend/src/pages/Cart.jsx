import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { cartApi } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cart, setCart } = useCartStore();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
  });

  useEffect(() => {
    if (data?.data?.data) {
      setCart(data.data.data);
    }
  }, [data, setCart]);

  const updateItemMutation = useMutation({
    mutationFn: ({ productId, quantity }) => cartApi.updateItem(productId, quantity),
    onSuccess: (response) => {
      setCart(response.data.data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update cart');
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (productId) => cartApi.removeItem(productId),
    onSuccess: (response) => {
      setCart(response.data.data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to remove item');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: (response) => {
      setCart(response.data.data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Cart cleared');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to clear cart');
    },
  });

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mb-6">
          Looks like you haven't added any items yet.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <button
          onClick={() => clearCartMutation.mutate()}
          disabled={clearCartMutation.isPending}
          className="text-red-600 hover:text-red-700 text-sm font-medium"
        >
          Clear Cart
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {cart.items.map((item) => (
            <li key={item.id} className="p-6">
              <div className="flex items-center gap-4">
                {/* Product Image */}
                <Link to={`/products/${item.product.id}`}>
                  <div className="h-20 w-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={
                        item.product.imageUrl ||
                        'https://via.placeholder.com/80x80?text=No+Image'
                      }
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </Link>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.product.id}`}
                    className="text-lg font-medium text-gray-900 hover:text-indigo-600"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-indigo-600 font-medium mt-1">
                    ${item.product.price.toFixed(2)}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateItemMutation.mutate({
                        productId: item.product.id,
                        quantity: item.quantity - 1,
                      })
                    }
                    disabled={
                      updateItemMutation.isPending || item.quantity <= 1
                    }
                    className="p-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateItemMutation.mutate({
                        productId: item.product.id,
                        quantity: item.quantity + 1,
                      })
                    }
                    disabled={
                      updateItemMutation.isPending ||
                      item.quantity >= item.product.stockQuantity
                    }
                    className="p-1 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right w-24">
                  <p className="font-medium text-gray-900">
                    ${item.subtotal.toFixed(2)}
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItemMutation.mutate(item.product.id)}
                  disabled={removeItemMutation.isPending}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Cart Summary */}
        <div className="bg-gray-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Subtotal ({cart.totalQuantity} items)</span>
            <span className="text-xl font-bold text-gray-900">
              ${cart.totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
