import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Minus, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, cartApi, getImageUrl, PLACEHOLDER_IMAGE } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id),
  });

  const addToCartMutation = useMutation({
    mutationFn: () => cartApi.addItem(id, quantity),
    onSuccess: (response) => {
      setCart(response.data.data);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to cart');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    },
  });

  const product = data?.data?.data;

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Product not found</p>
        <Link to="/products" className="text-indigo-600 hover:text-indigo-700">
          Back to Products
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    addToCartMutation.mutate();
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stockQuantity) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div>
      <Link
        to="/products"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Link>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="md:flex">
          {/* Product Image */}
          <div className="md:w-1/2">
            <div className="aspect-square bg-gray-100">
              <img
                src={getImageUrl(product.imageUrl) || PLACEHOLDER_IMAGE}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="md:w-1/2 p-6 md:p-8">
            {product.categoryName && (
              <p className="text-sm text-indigo-600 mb-2">{product.categoryName}</p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            <p className="text-3xl font-bold text-indigo-600 mb-6">
              ${product.price.toFixed(2)}
            </p>

            {product.description && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-900 mb-2">
                  Description
                </h2>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {product.stockQuantity === 0 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Out of Stock
                </span>
              ) : product.stockQuantity <= 5 ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                  Only {product.stockQuantity} left in stock
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  In Stock
                </span>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stockQuantity > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-medium w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stockQuantity}
                    className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || product.stockQuantity === 0}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                product.stockQuantity === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {addToCartMutation.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
