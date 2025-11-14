// Add your Clerk Publishable Key here
export const CLERK_PUBLISHABLE_KEY = 'pk_test_your_key_here'; // Replace with your Clerk key

// Backend API URL
export const API_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-production-api.com/api';  // Production
