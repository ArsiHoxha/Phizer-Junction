# Migraine Guardian Backend

Express + MongoDB backend for the Migraine Guardian mobile app.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (running locally on port 27017)
- Clerk account for authentication

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start MongoDB:**
   Make sure MongoDB is running locally:
   ```bash
   # macOS (if installed via Homebrew)
   brew services start mongodb-community
   
   # Or manually
   mongod --dbpath /path/to/your/data/directory
   ```

3. **Configure Clerk:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Get your Clerk Secret Key
   - Add it to the server (no .env file needed per your request)
   - Update line 8 in `server.js` with your Clerk Secret Key:
     ```javascript
     clerkClient({ secretKey: 'YOUR_CLERK_SECRET_KEY' })
     ```

## Running the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5001`

## API Endpoints

### User Management
- `POST /api/user` - Create or update user profile
- `GET /api/user/:clerkId` - Get user profile

### Onboarding
- `POST /api/onboarding/permissions` - Save permission settings
- `POST /api/onboarding/data-source` - Save data source preferences
- `POST /api/onboarding/triggers` - Save migraine triggers and frequency
- `POST /api/onboarding/complete` - Mark onboarding as complete

### Health Metrics
- `POST /api/metrics` - Add new health metrics
- `GET /api/metrics/:clerkId` - Get user's metrics history

### Risk Calculation
- `GET /api/risk/:clerkId` - Calculate current migraine risk
- `GET /api/risk-history/:clerkId` - Get risk calculation history

## Database Schema

### User
- clerkId (unique)
- email
- permissions (notifications, passiveData, calendar, location)
- dataSource (mode, wearableType)
- migraineFrequency
- triggers array
- onboardingComplete
- baselineMetrics

### Metric
- clerkId
- timestamp
- hrv, heartRate, screenTime, sleepHours, stressLevel
- weatherPressure, activityLevel

### RiskHistory
- clerkId
- timestamp
- riskScore
- breakdown (hrv, screen, sleep, stress, weather)
- recommendations

## Testing

Use tools like Postman or curl to test endpoints:

```bash
# Example: Create user
curl -X POST http://localhost:5001/api/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -d '{"email": "test@example.com"}'
```

## Troubleshooting

**Port already in use:**
- Change the port in `server.js` (line 14): `const PORT = 5001;`

**MongoDB connection error:**
- Ensure MongoDB is running: `brew services list | grep mongodb`
- Check connection string in `server.js` (line 16)

**Clerk authentication error:**
- Verify your Clerk Secret Key is correct
- Make sure the mobile app is sending the Bearer token in headers

## Production Deployment

For production, consider:
- Using environment variables for sensitive data
- Setting up MongoDB Atlas for cloud database
- Deploying to Heroku, Railway, or similar platforms
- Adding rate limiting and additional security measures
