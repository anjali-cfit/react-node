import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getById(id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const order = data?.data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
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

  return (
    <div className="max-w-4xl">
      <Link
        to="/orders"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-gray-500 mt-1">
            {new Date(order.createdAt).toLocaleString()}
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

      <div className="grid gap-6">
        {/* Update Status */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Update Status
          </h2>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => updateStatusMutation.mutate(status)}
                disabled={
                  updateStatusMutation.isPending || order.status === status
                }
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                  order.status === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Information
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{order.userName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{order.userEmail}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Shipping Address</p>
              <p className="font-medium text-gray-900 whitespace-pre-line">
                {order.shippingAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">
                    Product
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">
                    Price
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">
                    Quantity
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3 text-gray-900">{item.productName}</td>
                    <td className="py-3 text-gray-600 text-right">
                      ${item.productPrice.toFixed(2)}
                    </td>
                    <td className="py-3 text-gray-600 text-right">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-gray-900 text-right font-medium">
                      ${item.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-3 text-right font-semibold">
                    Total
                  </td>
                  <td className="py-3 text-right text-lg font-bold text-indigo-600">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
