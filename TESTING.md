# Testing Documentation

This project includes comprehensive testing for both frontend (React) and backend (Express.js) components.

## Frontend Testing

### Technologies Used
- **Jest** - Testing framework
- **React Testing Library** - Component testing utilities
- **@testing-library/jest-dom** - Additional DOM matchers
- **@testing-library/user-event** - User interaction simulation

### Test Structure
```
frontend/src/
├── components/
│   ├── HelloWorld.js
│   ├── UserList.js
│   └── __tests__/
│       ├── HelloWorld.test.js
│       └── UserList.test.js
├── hooks/
│   ├── useCounter.js
│   └── __tests__/
│       └── useCounter.test.js
└── services/
    ├── api.js
    └── __tests__/
        └── api.test.js
```

### Running Frontend Tests
```bash
cd frontend
npm test              # Run tests in watch mode
npm test -- --watchAll=false  # Run tests once
npm test -- --coverage        # Run tests with coverage report
```

### Test Categories

#### Component Tests
- **HelloWorld**: Tests basic component rendering and prop handling
- **UserList**: Tests list rendering, user interactions, and state management

#### Hook Tests
- **useCounter**: Tests custom hook functionality, state updates, and edge cases

#### Service Tests
- **API Client**: Tests API service functions with mocked fetch calls

### Key Testing Patterns

#### Component Testing
```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Test component rendering
const { container } = render(<HelloWorld />);
expect(screen.getByText('Hello World!')).toBeInTheDocument();

// Test user interactions
await userEvent.click(screen.getByTestId('user-1'));
expect(screen.getByText('Selected: John Doe')).toBeInTheDocument();
```

#### Custom Hook Testing
```javascript
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useCounter(10));
act(() => {
  result.current.increment();
});
expect(result.current.count).toBe(11);
```

#### API Mocking
```javascript
global.fetch = jest.fn();
fetch.mockResolvedValueOnce({
  ok: true,
  json: async () => mockUsers,
});
```

## Backend Testing

### Technologies Used
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library
- **Manual Mocks** - For mocking database and external dependencies

### Test Structure
```
backend/
├── __tests__/
│   └── server.test.js
├── services/
│   ├── userService.js
│   └── __tests__/
│       └── userService.test.js
└── routes/
    ├── users.js
    └── __tests__/
        └── users.test.js
```

### Running Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:verbose  # Run tests with detailed output
```

### Test Categories

#### Unit Tests
- **UserService**: Tests business logic with mocked database
- **Server**: Tests basic server endpoints and database connection

#### Integration Tests
- **User Routes**: Tests API endpoints with mocked service layer

### Key Testing Patterns

#### Service Mocking
```javascript
const pool = require('../db');
jest.mock('../db');

pool.query.mockResolvedValue({ 
  rows: mockUsers 
});
```

#### Route Testing
```javascript
const request = require('supertest');
const express = require('express');

const app = express();
app.use('/api/users', userRoutes);

const response = await request(app).get('/api/users/1');
expect(response.status).toBe(200);
```

#### Error Handling Tests
```javascript
userService.getUserById.mockRejectedValue(new Error('Database error'));
const response = await request(app).get('/api/users/1');
expect(response.status).toBe(500);
```

## Test Coverage

### Frontend Coverage Areas
- ✅ Component rendering and props
- ✅ User interactions and events
- ✅ Custom hooks functionality
- ✅ API service functions
- ✅ Error handling

### Backend Coverage Areas
- ✅ Service layer business logic
- ✅ Database operations
- ✅ API endpoint functionality
- ✅ Error handling and validation
- ✅ Request/response formatting

## Best Practices

### Frontend
1. **Test user interactions** rather than implementation details
2. **Use queries that resemble how users find elements**
3. **Mock external dependencies** like API calls
4. **Test edge cases** and error states
5. **Use setup/teardown** for complex test scenarios

### Backend
1. **Mock database and external services**
2. **Test both success and error scenarios**
3. **Test input validation and edge cases**
4. **Use separate test environments**
5. **Test HTTP status codes and response formats**

## Continuous Integration

Tests are configured to run automatically and can be integrated with CI/CD pipelines. Both frontend and backend tests generate coverage reports that help identify untested code paths.

### Coverage Reports
- Frontend: `frontend/coverage/` (after running with --coverage)
- Backend: `backend/coverage/` (after running with --coverage)

View coverage reports by opening `coverage/lcov-report/index.html` in your browser after running tests with coverage flags.