import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { cartApi, ordersApi } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Checkout() {
  const [shippingAddress, setShippingAddress] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cart, setCart, clearCart } = useCartStore();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
  });

  useEffect(() => {
    if (data?.data?.data) {
      setCart(data.data.data);
    }
  }, [data, setCart]);

  const placeOrderMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (response) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Order placed successfully!');
      navigate(`/orders/${response.data.data.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to place order');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      toast.error('Please enter a shipping address');
      return;
    }
    placeOrderMutation.mutate(shippingAddress);
  };

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
        <p className="text-gray-500 mb-4">Your cart is empty</p>
        <Link
          to="/products"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/cart"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Cart
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Shipping Form */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Shipping Address
            </h2>
            <form onSubmit={handleSubmit}>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter your full shipping address..."
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={placeOrderMutation.isPending}
                className="w-full mt-4 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {placeOrderMutation.isPending ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  `Place Order - $${cart.totalPrice.toFixed(2)}`
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Order Summary
            </h2>
            <ul className="divide-y divide-gray-200">
              {cart.items.map((item) => (
                <li key={item.id} className="py-3 flex items-center gap-3">
                  <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={
                        item.product.imageUrl ||
                        'https://via.placeholder.com/48x48?text=No+Image'
                      }
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${item.subtotal.toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <p>Total</p>
                <p>${cart.totalPrice.toFixed(2)}</p>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {cart.totalQuantity} item{cart.totalQuantity !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
