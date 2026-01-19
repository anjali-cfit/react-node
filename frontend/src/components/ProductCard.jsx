import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { cartApi, getImageUrl, PLACEHOLDER_IMAGE } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function ProductCard({ product }) {
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();
  const queryClient = useQueryClient();

  const addToCartMutation = useMutation({
    mutationFn: () => cartApi.addItem(product.id, 1),
    onSuccess: (response) => {
      setCart(response.data.data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    },
  });

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    addToCartMutation.mutate();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/products/${product.id}`}>
        <div className="aspect-square bg-gray-100">
          <img
            src={getImageUrl(product.imageUrl) || PLACEHOLDER_IMAGE}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>
      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-lg font-medium text-gray-900 hover:text-indigo-600 truncate">
            {product.name}
          </h3>
        </Link>
        {product.categoryName && (
          <p className="text-sm text-gray-500 mt-1">{product.categoryName}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xl font-bold text-indigo-600">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending || product.stockQuantity === 0}
            className={`p-2 rounded-md transition-colors ${
              product.stockQuantity === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
        {product.stockQuantity === 0 && (
          <p className="text-sm text-red-500 mt-2">Out of stock</p>
        )}
        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
          <p className="text-sm text-orange-500 mt-2">
            Only {product.stockQuantity} left
          </p>
        )}
      </div>
    </div>
  );
}
