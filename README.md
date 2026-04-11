# Qupedia Backend API

A comprehensive NestJS backend application for the Qupedia platform - a store discovery and chat application.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Store Management**: Complete CRUD operations for stores with categories and ratings
- **Real-time Chat**: WebSocket-based chat system between users and stores
- **File Upload**: AWS S3 integration for image and document uploads
- **Search & Discovery**: Advanced search with location-based filtering
- **Reviews & Ratings**: User review system with automatic rating calculations
- **Health Monitoring**: Comprehensive health checks and monitoring endpoints
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT with Passport
- **File Storage**: AWS S3
- **Cache**: Redis
- **Real-time**: Socket.io
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Node.js 20+
- MySQL 8.0+
- Redis 6.0+
- AWS S3 account (for file uploads)
- Docker & Docker Compose (optional)

## Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend-nest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   npm run migration:run
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Debug mode
   npm run start:debug
   
   # Production mode
   npm run start:prod
   ```

### Docker Development

1. **Start all services**
   ```bash
   npm run docker:dev
   ```

2. **View logs**
   ```bash
   npm run docker:logs
   ```

3. **Stop services**
   ```bash
   npm run docker:down
   ```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=qupedia

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## API Documentation

Once the application is running, visit:
- **Swagger UI**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/health`

## Database Migrations

The application includes comprehensive database migrations:

```bash
# Run all pending migrations
npm run migration:run

# Create a new migration (manual process)
npm run migration:create
```

## Available Scripts

```bash
# Development
npm run start:dev          # Start in watch mode
npm run start:debug        # Start with debugging

# Production
npm run build              # Build the application
npm run start:prod         # Start production server

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run e2e tests
npm run test:cov           # Run tests with coverage

# Docker
npm run docker:build       # Build Docker image
npm run docker:dev         # Start development environment
npm run docker:prod        # Start production environment
npm run docker:down        # Stop all containers
npm run docker:logs        # View application logs

# Database
npm run migration:run      # Run database migrations

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
```

## Project Structure

```
src/
├── app.module.ts          # Main application module
├── main.ts                # Application entry point
├── auth/                  # Authentication module
│   ├── controllers/       # Auth controllers
│   ├── services/          # Auth services
│   ├── guards/            # Auth guards
│   ├── strategies/        # Passport strategies
│   └── decorators/        # Custom decorators
├── users/                 # User management module
├── stores/                # Store management module
├── categories/            # Category management module
├── chat/                  # Real-time chat module
├── seasonal-topics/       # Seasonal topics module
├── common/                # Shared utilities
│   ├── controllers/       # Common controllers (upload)
│   ├── services/          # Common services
│   ├── filters/           # Exception filters
│   ├── pipes/             # Validation pipes
│   ├── interceptors/      # HTTP interceptors
│   └── decorators/        # Custom decorators
├── health/                # Health check module
└── config/                # Configuration files

migrations/                # Database migrations
docker-compose.yml         # Docker composition
Dockerfile                 # Production Docker image
Dockerfile.dev             # Development Docker image
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `POST /api/v1/users/avatar` - Upload user avatar

### Stores
- `GET /api/v1/stores` - List stores with filtering
- `GET /api/v1/stores/:id` - Get store details
- `POST /api/v1/stores` - Create new store
- `PUT /api/v1/stores/:id` - Update store
- `DELETE /api/v1/stores/:id` - Delete store

### Categories
- `GET /api/v1/categories` - List all categories
- `GET /api/v1/categories/:id` - Get category details
- `POST /api/v1/categories` - Create category (admin)
- `PUT /api/v1/categories/:id` - Update category (admin)

### Chat
- `GET /api/v1/chat/conversations` - List user conversations
- `POST /api/v1/chat/conversations` - Start new conversation
- `GET /api/v1/chat/conversations/:id/messages` - Get conversation messages
- `POST /api/v1/chat/messages` - Send message

### File Upload
- `POST /api/v1/upload/file` - Upload single file
- `POST /api/v1/upload/files` - Upload multiple files
- `POST /api/v1/upload/avatar` - Upload user avatar
- `POST /api/v1/upload/store-logo` - Upload store logo
- `POST /api/v1/upload/store-cover` - Upload store cover image

### Health
- `GET /health` - Comprehensive health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

## WebSocket Events

### Chat Events
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `send_message` - Send a message
- `message_received` - Receive a message
- `typing_start` - User started typing
- `typing_stop` - User stopped typing
- `user_online` - User came online
- `user_offline` - User went offline

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for users, store owners, and admins
- **Input Validation**: Comprehensive request validation using class-validator
- **CORS Protection**: Configurable CORS settings
- **Rate Limiting**: API rate limiting (configurable)
- **File Upload Security**: File type and size validation
- **SQL Injection Protection**: Sequelize ORM with parameterized queries

## Monitoring & Health Checks

- **Health Endpoints**: Database, memory, and disk health checks
- **Logging**: Structured logging with request/response tracking
- **Error Handling**: Global exception filters with proper error responses
- **Metrics**: Application metrics and monitoring

## Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm run start:prod
   ```

### Docker Production

1. **Build and start**
   ```bash
   npm run docker:prod
   ```

2. **Environment variables**
   - Ensure all production environment variables are set
   - Use secure secrets for JWT_SECRET, database passwords, etc.

### Health Checks

The application includes Docker health checks:
- Container health: `http://localhost:3000/health/live`
- Application readiness: `http://localhost:3000/health/ready`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.