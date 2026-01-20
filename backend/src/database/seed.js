import pg from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const seed = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'ecommerce_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const customerPassword = await bcrypt.hash('customer123', 12);

    // Create admin user
    const adminId = uuidv4();
    await client.query(`
      INSERT INTO users (id, email, password, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, [adminId, 'admin@example.com', adminPassword, 'Admin', 'User', 'admin']);

    // Create customer user
    const customerId = uuidv4();
    await client.query(`
      INSERT INTO users (id, email, password, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, [customerId, 'customer@example.com', customerPassword, 'John', 'Doe', 'customer']);


    // Create categories
    const categories = [
      { id: uuidv4(), name: 'Electronics', description: 'Electronic devices and gadgets' },
      { id: uuidv4(), name: 'Clothing', description: 'Fashion and apparel' },
      { id: uuidv4(), name: 'Books', description: 'Books and literature' },
      { id: uuidv4(), name: 'Home & Garden', description: 'Home improvement and garden supplies' },
      { id: uuidv4(), name: 'Sports', description: 'Sports equipment and accessories' },
    ];

    for (const category of categories) {
      await client.query(`
        INSERT INTO categories (id, name, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO NOTHING
      `, [category.id, category.name, category.description]);
    }


    // Get category IDs
    const categoryResult = await client.query('SELECT id, name FROM categories');
    const categoryMap = {};
    categoryResult.rows.forEach(row => {
      categoryMap[row.name] = row.id;
    });

    // Create products
    const products = [
      {
        name: 'Smartphone Pro X',
        description: 'Latest smartphone with advanced features and 5G connectivity',
        price: 999.99,
        stockQuantity: 50,
        categoryId: categoryMap['Electronics'],
        imageUrl: 'https://via.placeholder.com/300x300?text=Smartphone'
      },
      {
        name: 'Wireless Headphones',
        description: 'Premium noise-canceling wireless headphones',
        price: 299.99,
        stockQuantity: 100,
        categoryId: categoryMap['Electronics'],
        imageUrl: 'https://via.placeholder.com/300x300?text=Headphones'
      },
      {
        name: 'Laptop Ultra',
        description: 'Powerful laptop for professionals and creators',
        price: 1499.99,
        stockQuantity: 30,
        categoryId: categoryMap['Electronics'],
        imageUrl: 'https://via.placeholder.com/300x300?text=Laptop'
      },
      {
        name: 'Classic T-Shirt',
        description: 'Comfortable cotton t-shirt in various colors',
        price: 29.99,
        stockQuantity: 200,
        categoryId: categoryMap['Clothing'],
        imageUrl: 'https://via.placeholder.com/300x300?text=T-Shirt'
      },
      {
        name: 'Denim Jeans',
        description: 'High-quality denim jeans with modern fit',
        price: 79.99,
        stockQuantity: 150,
        categoryId: categoryMap['Clothing'],
        imageUrl: 'https://via.placeholder.com/300x300?text=Jeans'
      },
      {
        name: 'Winter Jacket',
        description: 'Warm and stylish winter jacket',
        price: 199.99,
        stockQuantity: 75,
        categoryId: categoryMap['Clothing'],
        imageUrl: 'https://via.placeholder.com/300x300?text=Jacket'
      },
      {
        name: 'Programming Guide',
        description: 'Comprehensive guide to modern programming',
        price: 49.99,
        stockQuantity: 100,
        categoryId: categoryMap['Books'],
        imageUrl: 'https://via.placeholder.com/300x300?text=Book'
      },
      {
        name: 'Garden Tool Set',
        description: 'Complete set of essential garden tools',
        price: 89.99,
        stockQuantity: 60,
        categoryId: categoryMap['Home & Garden'],
        imageUrl: 'https://via.placeholder.com/300x300?text=Garden+Tools'
      },
      {
        name: 'Yoga Mat',
        description: 'Premium non-slip yoga mat',
        price: 39.99,
        stockQuantity: 120,
        categoryId: categoryMap['Sports'],
        imageUrl: 'https://via.placeholder.com/300x300?text=Yoga+Mat'
      },
      {
        name: 'Running Shoes',
        description: 'Lightweight running shoes for performance',
        price: 129.99,
        stockQuantity: 80,
        categoryId: categoryMap['Sports'],
        imageUrl: 'https://via.placeholder.com/300x300?text=Running+Shoes'
      },
    ];

    for (const product of products) {
      await client.query(`
        INSERT INTO products (name, description, price, stock_quantity, category_id, image_url)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [product.name, product.description, product.price, product.stockQuantity, product.categoryId, product.imageUrl]);
    }

  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

seed();
