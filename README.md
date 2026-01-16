# E-Commerce Application

A full-stack e-commerce application built with Node.js, Express, PostgreSQL, and React.

## Project Structure

```
ecommerce/
├── backend/           # Node.js + Express API
├── frontend/          # React customer storefront
├── admin/             # React admin panel
└── README.md
```

## Features

### Customer Features
- User registration and authentication
- Browse products with pagination and filtering
- Search products by name and description
- Filter by category, price range
- Shopping cart management
- Order placement and tracking
- Order history

### Admin Features
- Dashboard with statistics
- Product management (CRUD)
- Category management (CRUD)
- Order management and status updates
- View all orders

## Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Swagger/OpenAPI** for API documentation

### Frontend & Admin
- **React 18** with Vite
- **React Router v7** for navigation
- **TanStack Query** for data fetching
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Lucide React** for icons

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ecommerce
```

### 2. Database Setup

1. Install PostgreSQL if not already installed
2. Create a new database:

```sql
CREATE DATABASE ecommerce_db;
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate

# Seed the database with sample data
npm run db:seed

# Start the server
npm run dev
```

The API will be available at `http://localhost:5000`

### 4. Frontend Setup (Customer)

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The customer frontend will be available at `http://localhost:3000`

### 5. Admin Panel Setup

```bash
cd admin

# Install dependencies
npm install

# Start the development server
npm run dev
```

The admin panel will be available at `http://localhost:3001`

## Default Users

After running the seed script, you'll have these users:

| Role     | Email                 | Password    |
|----------|----------------------|-------------|
| Admin    | admin@example.com    | admin123    |
| Customer | customer@example.com | customer123 |

## API Documentation

API documentation is available at: `http://localhost:5000/api-docs`

## API Endpoints

### Authentication
| Method | Endpoint              | Description              | Auth |
|--------|----------------------|--------------------------|------|
| POST   | /api/auth/register   | Register new customer    | No   |
| POST   | /api/auth/login      | Login user               | No   |
| GET    | /api/auth/profile    | Get current user profile | Yes  |
| PUT    | /api/auth/profile    | Update user profile      | Yes  |

### Products
| Method | Endpoint           | Description              | Auth    |
|--------|-------------------|--------------------------|---------|
| GET    | /api/products     | List products (paginated)| No      |
| GET    | /api/products/:id | Get product details      | No      |
| POST   | /api/products     | Create product           | Admin   |
| PUT    | /api/products/:id | Update product           | Admin   |
| DELETE | /api/products/:id | Delete product           | Admin   |

#### Query Parameters for GET /api/products
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `categoryId` - Filter by category
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `search` - Search in name and description
- `sortBy` - Sort field (name, price, created_at)
- `sortOrder` - ASC or DESC

### Categories
| Method | Endpoint             | Description         | Auth  |
|--------|---------------------|---------------------|-------|
| GET    | /api/categories     | List all categories | No    |
| GET    | /api/categories/:id | Get category        | No    |
| POST   | /api/categories     | Create category     | Admin |
| PUT    | /api/categories/:id | Update category     | Admin |
| DELETE | /api/categories/:id | Delete category     | Admin |

### Cart
| Method | Endpoint                    | Description           | Auth |
|--------|----------------------------|-----------------------|------|
| GET    | /api/cart                  | Get current cart      | Yes  |
| POST   | /api/cart/items            | Add item to cart      | Yes  |
| PUT    | /api/cart/items/:productId | Update item quantity  | Yes  |
| DELETE | /api/cart/items/:productId | Remove item from cart | Yes  |
| DELETE | /api/cart                  | Clear cart            | Yes  |

### Orders
| Method | Endpoint                | Description              | Auth     |
|--------|------------------------|--------------------------|----------|
| POST   | /api/orders            | Create order from cart   | Yes      |
| GET    | /api/orders/my-orders  | Get current user's orders| Yes      |
| GET    | /api/orders            | Get all orders           | Admin    |
| GET    | /api/orders/:id        | Get order details        | Yes      |
| PATCH  | /api/orders/:id/status | Update order status      | Admin    |

## Example API Requests

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Products with Filters
```bash
curl "http://localhost:5000/api/products?page=1&limit=10&minPrice=10&maxPrice=100&sortBy=price&sortOrder=ASC"
```

### Add to Cart
```bash
curl -X POST http://localhost:5000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": "uuid-here",
    "quantity": 2
  }'
```

### Place Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "shippingAddress": "123 Main St, City, Country"
  }'
```

## Database Schema

### ERD Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │     │  categories  │     │   products   │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (PK)      │     │ id (PK)      │     │ id (PK)      │
│ email        │     │ name         │     │ name         │
│ password     │     │ description  │     │ description  │
│ first_name   │     │ is_active    │     │ price        │
│ last_name    │     │ created_at   │     │ stock_qty    │
│ role         │     │ updated_at   │     │ category_id  │◄─┐
│ is_active    │     └──────────────┘     │ image_url    │  │
│ created_at   │                          │ is_active    │  │
│ updated_at   │                          │ created_at   │  │
└──────────────┘                          │ updated_at   │  │
       │                                  └──────────────┘  │
       │                                         │          │
       │                                         │          │
       ▼                                         ▼          │
┌──────────────┐                          ┌──────────────┐  │
│    carts     │                          │  cart_items  │  │
├──────────────┤                          ├──────────────┤  │
│ id (PK)      │                          │ id (PK)      │  │
│ user_id (FK) │──────────────────────────│ cart_id (FK) │  │
│ created_at   │                          │ product_id   │──┘
│ updated_at   │                          │ quantity     │
└──────────────┘                          │ created_at   │
       │                                  │ updated_at   │
       │                                  └──────────────┘
       ▼
┌──────────────┐                          ┌──────────────┐
│    orders    │                          │ order_items  │
├──────────────┤                          ├──────────────┤
│ id (PK)      │                          │ id (PK)      │
│ user_id (FK) │──────────────────────────│ order_id(FK) │
│ total_amount │                          │ product_id   │
│ status       │                          │ product_name │
│ ship_address │                          │ product_price│
│ created_at   │                          │ quantity     │
│ updated_at   │                          │ subtotal     │
└──────────────┘                          │ created_at   │
                                          └──────────────┘
```

## Architecture Decisions

### Backend Architecture
- **Layered Architecture**: Controllers → Services → Repositories → Database
- **Repository Pattern**: Data access logic is abstracted into repositories
- **Service Layer**: Business logic is contained in services
- **Middleware**: Authentication, validation, and error handling

### Frontend Architecture
- **Component-Based**: Reusable React components
- **State Management**: Zustand for global state (auth, cart)
- **Data Fetching**: TanStack Query for server state management
- **Routing**: React Router for navigation

### Database Design
- **Normalization**: Tables are normalized to reduce redundancy
- **Foreign Keys**: Referential integrity with CASCADE on delete
- **Indexes**: Added on frequently queried columns (category, price, status)
- **Triggers**: Auto-update `updated_at` timestamps

## Assumptions & Trade-offs

### Assumptions
1. Single currency (USD) for all products
2. No real payment processing (simplified checkout)
3. No product variants (size, color, etc.)
4. Simple flat shipping (no address validation)
5. Email is the unique identifier for users

### Trade-offs
1. **SQLite vs PostgreSQL**: Chose PostgreSQL for production-readiness and scalability
2. **JWT vs Sessions**: JWT for stateless authentication (easier to scale)
3. **No image upload**: Using URL references for simplicity
4. **No real-time updates**: Using polling/refetch instead of WebSockets
5. **Soft delete vs Hard delete**: Chose hard delete for simplicity

## Running Tests

```bash
cd backend
npm test
```

## Production Deployment

### Environment Variables
Make sure to set these in production:
- `NODE_ENV=production`
- `JWT_SECRET=<strong-random-secret>`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### Build Commands
```bash
# Frontend
cd frontend && npm run build

# Admin
cd admin && npm run build
```

## Future Improvements

- [ ] Add product images upload
- [ ] Implement product variants
- [ ] Add payment gateway integration
- [ ] Add email notifications
- [ ] Implement product reviews
- [ ] Add wishlist functionality
- [ ] Implement real-time order tracking
- [ ] Add inventory management alerts

## License

MIT
