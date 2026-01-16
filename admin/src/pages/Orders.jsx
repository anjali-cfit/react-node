import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { ordersApi } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || 'all';

  const { data, isLoading } = useQuery({
    queryKey: ['orders', { page, status: status === 'all' ? undefined : status }],
    queryFn: () =>
      ordersApi.getAll({
        page,
        limit: 10,
        status: status === 'all' ? undefined : status,
      }),
  });

  const orders = data?.data?.data?.orders || [];
  const pagination = data?.data?.data?.pagination || { page: 1, totalPages: 1 };

  const updateParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => updateParams('status', s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              status === s
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Order ID
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Customer
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                Date
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                Status
              </th>
              <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                Items
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                Total
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.userName}
                      </p>
                      <p className="text-xs text-gray-500">{order.userEmail}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        statusColors[order.status]
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-center">
                    {order.items.length}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
                    >
                      View
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateParams('page', String(page - 1))}
                disabled={page === 1}
                className="p-2 rounded bg-white border disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => updateParams('page', String(page + 1))}
                disabled={page === pagination.totalPages}
                className="p-2 rounded bg-white border disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
