import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package } from 'lucide-react';
import { ordersApi } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
  });

  const order = data?.data?.data;

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Order not found</p>
        <Link to="/orders" className="text-indigo-600 hover:text-indigo-700">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/orders"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Link>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Order #{order.id.slice(0, 8)}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Placed on{' '}
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                statusColors[order.status]
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Status Progress */}
        {order.status !== 'cancelled' && (
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index <= currentStepIndex
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      '✓'
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm capitalize ${
                      index <= currentStepIndex
                        ? 'text-indigo-600 font-medium'
                        : 'text-gray-500'
                    }`}
                  >
                    {step}
                  </span>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`w-12 md:w-24 h-1 mx-2 md:mx-4 ${
                        index < currentStepIndex ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
          <ul className="divide-y divide-gray-200">
            {order.items.map((item) => (
              <li key={item.id} className="py-4 flex items-center gap-4">
                <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={`https://via.placeholder.com/64x64?text=${item.productName.charAt(0)}`}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{item.productName}</p>
                  <p className="text-sm text-gray-500">
                    ${item.productPrice.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-gray-900">
                  ${item.subtotal.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Summary */}
        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Shipping Address
            </h2>
            <p className="text-gray-600 whitespace-pre-line">
              {order.shippingAddress}
            </p>
          </div>

          {/* Order Total */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Order Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-900">Free</span>
              </div>
              <div className="flex justify-between text-base font-medium pt-2 border-t">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
