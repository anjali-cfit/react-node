import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, categoriesApi, getImageUrl } from '../lib/api';
import { IMAGE_CONSTRAINTS } from '../../../shared/constants';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    categoryId: '',
    isActive: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const { data: productData, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id),
    enabled: isEditing,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  useEffect(() => {
    if (productData?.data?.data) {
      const product = productData.data.data;
      setFormData({
        name: product.name,
        description: product.description || '',
        price: String(product.price),
        stockQuantity: String(product.stockQuantity),
        categoryId: product.categoryId || '',
        isActive: product.isActive,
      });
      if (product.imageUrl) {
        setExistingImage(product.imageUrl);
      }
    }
  }, [productData]);

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created');
      navigate('/products');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success('Product updated');
      navigate('/products');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });

  const categories = categoriesData?.data?.data || [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 1) {
      toast.error('Price must be a positive number');
      return;
    }

    const stockQty = parseInt(formData.stockQuantity, 10);
    if (isNaN(stockQty) || stockQty < 1) {
      toast.error('Stock quantity must be a non-negative number');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description || '');
    data.append('price', formData.price);
    data.append('stockQuantity', formData.stockQuantity);
    data.append('categoryId', formData.categoryId || '');
    data.append('isActive', formData.isActive);

    if (imageFile) {
      data.append('image', imageFile);
    }

    if (removeImage) {
      data.append('removeImage', 'true');
    }

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > IMAGE_CONSTRAINTS.MAX_SIZE) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    if (!IMAGE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    setImageFile(file);
    setRemoveImage(false);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    resetFileInput();
  };

  const handleCancelNewImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    resetFileInput();
  };

  const getImageSrc = () => {
    if (imagePreview) return imagePreview;
    if (!removeImage && existingImage) return getImageUrl(existingImage);
    return null;
  };

  const currentImage = getImageSrc();

  if (isEditing && productLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        to="/products"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Products
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                id="stockQuantity"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>

            {currentImage ? (
              <div className="relative inline-block">
                <img
                  src={currentImage}
                  alt="Product preview"
                  className="w-40 h-40 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={imagePreview ? handleCancelNewImage : handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
                {imagePreview && existingImage && (
                  <p className="text-xs text-green-600 mt-1">New image selected</p>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
              >
                <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload image</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP up to 5MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            {currentImage && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                Change image
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Product is active (visible to customers)
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Link to="/products" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <LoadingSpinner size="sm" />}
            {isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
