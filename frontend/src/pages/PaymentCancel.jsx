import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ShoppingCart, ArrowLeft } from 'lucide-react';
import { paymentApi } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState(null);

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const cancelOrder = async () => {
      if (!orderId) {
        setIsProcessing(false);
        return;
      }

      try {
        await paymentApi.handleCancel(orderId);
      } catch (err) {
        console.error('Cancel order error:', err);
        // Don't show error to user, just log it
        // The order might already be cancelled or processed
      } finally {
        setIsProcessing(false);
      }
    };

    cancelOrder();
  }, [orderId]);

  if (isProcessing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Processing...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-md text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-yellow-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          Your payment was cancelled and no charges were made. Your cart items are still available.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            If you experienced any issues during checkout, please try again or contact our support team for assistance.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/cart"
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Return to Cart</span>
          </Link>
          <Link
            to="/checkout"
            className="block w-full border border-indigo-600 text-indigo-600 py-3 px-4 rounded-lg font-medium hover:bg-indigo-50"
          >
            Try Again
          </Link>
          <Link
            to="/products"
            className="flex items-center justify-center gap-2 w-full text-gray-600 py-3 px-4 rounded-lg font-medium hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
