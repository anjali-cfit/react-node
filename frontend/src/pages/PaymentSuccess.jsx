import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi } from '../lib/api';
import { useCartStore } from '../store/cartStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clearCart } = useCartStore();

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const confirmPayment = async () => {
      if (!sessionId) {
        setError('Invalid payment session');
        setIsProcessing(false);
        return;
      }

      try {
        const response = await paymentApi.handleSuccess(sessionId);
        setOrder(response.data.data);

        // Clear the cart
        clearCart();

        // Invalidate cart and orders queries
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });

        toast.success('Payment successful! Your order has been placed.');
      } catch (err) {
        console.error('Payment confirmation error:', err);
        setError(err.response?.data?.message || 'Failed to confirm payment');
      } finally {
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [sessionId, clearCart, queryClient]);

  if (isProcessing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Confirming your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-3xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <Link
              to="/orders"
              className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700"
            >
              View My Orders
            </Link>
            <Link
              to="/products"
              className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-md text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been confirmed and is being processed.
        </p>

        {order && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-gray-700 mb-2">
              <Package className="w-5 h-5" />
              <span className="font-medium">Order ID</span>
            </div>
            <p className="text-sm text-gray-500 font-mono break-all">{order.id}</p>
            <p className="text-lg font-bold text-gray-900 mt-2">
              Total: ${order.totalAmount?.toFixed(2)}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link
            to={order ? `/orders/${order.id}` : '/orders'}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700"
          >
            <span>View Order Details</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/products"
            className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
