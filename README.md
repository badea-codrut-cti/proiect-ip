# Full Stack React + Express.js + PostgreSQL App

This project contains a React frontend and Express.js backend with PostgreSQL database, all containerized with Docker.

## Project Structure

- **frontend/** - React application
- **backend/** - Express.js API server
- **docker-compose.yml** - Docker orchestration file

## Quick Start

1. Make sure you have Docker and Docker Compose installed

2. Run the entire stack:
```bash
docker-compose up --build
```

3. Access the applications:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

## Testing the Setup

- Test backend: http://localhost:5000/api/test
- Test database connection: http://localhost:5000/api/db-test

## Development

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

### Backend (Express.js)
```bash
cd backend
npm install
npm run dev  # Uses nodemon for hot reload
```

### Database
PostgreSQL is running in a Docker container with the following credentials:
- Database: myapp
- User: postgres
- Password: postgres
- Port: 5432

## API Endpoints

- `GET /` - Basic hello message
- `GET /api/test` - API test endpoint
- `GET /api/db-test` - Database connection test
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Testing

### Frontend Testing
```bash
cd frontend
npm test                    # Run tests in watch mode
npm test -- --coverage      # Run tests with coverage
```

### Backend Testing  
```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage
npm run test:verbose        # Run tests with detailed output
```

### Docker Testing
```bash
# Run tests in isolated Docker environment
docker-compose -f docker-compose.test.yml up --build
```

See [TESTING.md](TESTING.md) for comprehensive testing documentation.
