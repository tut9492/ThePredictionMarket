# Testing Documentation

## Test Coverage
- Component rendering tests
- Data fetching and transformation
- User interaction flows
- Responsive design validation
- API endpoint testing

## Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Test Files
- `__tests__/components/Header.test.tsx`
- `__tests__/components/MarketCard.test.tsx`
- `__tests__/pages/data.test.tsx`
- `__tests__/api/marketshare.test.ts`
- `__tests__/api/top-markets.test.ts`

## Testing Strategy
1. **Unit Tests:** Test individual components and functions
2. **Integration Tests:** Test component interactions
3. **E2E Tests:** Test complete user flows
4. **Visual Regression:** Test UI consistency

## Test Environment
- Jest for unit testing
- React Testing Library for component tests
- Mock API responses for data fetching tests

