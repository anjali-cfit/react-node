import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { cartApi, paymentApi, getImageUrl, PLACEHOLDER_IMAGE } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Checkout() {
  const [shippingAddress, setShippingAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shippingAddress.trim()) {
      toast.error('Please enter a shipping address');
      return;
    }
    if (shippingAddress.trim().length < 10) {
      toast.error('Please enter a complete shipping address');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Creating checkout session with address:', shippingAddress);
      const response = await paymentApi.createCheckoutSession(shippingAddress);
      console.log('Checkout response:', response);
      const sessionUrl = response?.data?.data?.sessionUrl;

      if (sessionUrl) {
        console.log('Redirecting to Stripe:', sessionUrl);
        window.location.href = sessionUrl;
      } else {
        console.error('No sessionUrl in response:', response?.data);
        setIsProcessing(false);
        toast.error('Failed to get payment URL');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      console.error('Error response:', error?.response?.data);
      setIsProcessing(false);
      const message = error?.response?.data?.message || error?.message || 'Failed to initiate payment';
      toast.error(message);
    }
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
                placeholder="Enter your full shipping address including:&#10;Street address&#10;City, State/Province&#10;ZIP/Postal code&#10;Country"
                rows={5}
                required
                disabled={isProcessing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />

              {/* Stripe Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Lock className="h-4 w-4 mr-2 text-green-600" />
                  Secure payment powered by Stripe
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <CreditCard className="h-4 w-4 mr-2" />
                  You will be redirected to Stripe to complete payment
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-4 bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Redirecting to payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Pay ${cart.totalPrice.toFixed(2)}</span>
                  </>
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
                        getImageUrl(item.product.imageUrl) ||
                        PLACEHOLDER_IMAGE
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
                      Qty: {item.quantity} x ${item.product.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${item.subtotal.toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <p>Subtotal</p>
                <p>${cart.totalPrice.toFixed(2)}</p>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <p>Shipping</p>
                <p>Free</p>
              </div>
              <div className="flex justify-between text-base font-medium text-gray-900 pt-2 border-t">
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
