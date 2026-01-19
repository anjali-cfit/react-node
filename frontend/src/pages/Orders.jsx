import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight } from 'lucide-react';
import { ordersApi, PLACEHOLDER_IMAGE } from '../lib/api';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../../shared/constants';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getMyOrders({ limit: 50 }),
  });

  const orders = data?.data?.data?.orders || [];

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">When you place an order, it will appear here.</p>
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div
                      key={index}
                      className="h-10 w-10 rounded-full bg-gray-100 border-2 border-white overflow-hidden"
                    >
                      <img
                        src={PLACEHOLDER_IMAGE}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="h-10 w-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-sm font-medium text-gray-600">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">${order.totalAmount.toFixed(2)}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
