# Migraine Guardian - Client Setup

React Native mobile app for migraine prevention and monitoring.

## Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator
- Clerk account for authentication

## Setup

1. **Install dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Configure Clerk:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Create a new application or use existing one
   - Get your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - Update `/config/config.ts`:
     ```typescript
     export const CLERK_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE';
     ```

3. **Configure API URL:**
   - In `/config/config.ts`, update the API URL if your backend is not on localhost:5001
   - For iOS Simulator: `http://localhost:5001`
   - For Android Emulator: `http://10.0.2.2:5001`
   - For physical device: Use your computer's IP address

## Running the App

**Start the Expo development server:**
```bash
npx expo start
```

Then choose your platform:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app for physical device

## Project Structure

```
client/
├── app/                    # Expo Router screens
│   ├── _layout.tsx        # Root layout with Clerk provider
│   ├── index.tsx          # Welcome screen
│   ├── auth/              # Authentication screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── onboarding/        # Onboarding flow
│   │   ├── permissions.tsx
│   │   ├── data-sources.tsx
│   │   ├── trigger-personalization.tsx
│   │   └── dashboard-intro.tsx
│   └── dashboard.tsx      # Main dashboard
├── services/
│   └── api.ts            # API service layer
├── config/
│   └── config.ts         # Configuration (Clerk key, API URL)
└── components/           # Reusable components
```

## App Flow

1. **Welcome Screen** → Sign Up/Sign In
2. **Authentication** → Clerk handles auth
3. **Onboarding:**
   - Permissions selection
   - Data source setup (Phone vs Wearable)
   - Trigger personalization
   - Dashboard introduction
4. **Dashboard** → Main app interface

## Features

- 🔐 **Clerk Authentication** - Secure email/password auth
- 📊 **Real-time Risk Monitoring** - 0-100% migraine risk score
- 📈 **Health Metrics Tracking** - HRV, sleep, stress, screen time
- 🎯 **Trigger Identification** - AI-powered pattern recognition
- 🌦️ **Weather Integration** - Barometric pressure tracking
- 🔔 **Voice Alerts** - Proactive notifications
- 🎨 **Minimalist Design** - Black & white theme

## Styling

This project uses **NativeWind** (Tailwind CSS for React Native):
- Configured in `tailwind.config.js`
- Black & white color scheme
- Responsive design with smooth animations

## Troubleshooting

**Clerk not loading:**
- Verify `CLERK_PUBLISHABLE_KEY` in `config/config.ts`
- Check Clerk dashboard for correct key
- Ensure `@clerk/clerk-expo` is installed

**API connection error:**
- Make sure backend server is running on port 5001
- Check `API_BASE_URL` in `config/config.ts`
- For Android emulator, use `10.0.2.2` instead of `localhost`

**Build errors:**
- Clear cache: `npx expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Reset Metro bundler: `npx expo start --clear`

## Development Tips

- Use `npx expo install` for installing packages (ensures version compatibility)
- Hot reload is enabled by default
- Use iOS Simulator for faster development (Mac only)
- Test on both iOS and Android before deploying

## Next Steps

- Start the backend server (see `backend/README.md`)
- Configure Clerk keys in both frontend and backend
- Run the app and test the complete flow
- Add real health data integrations (Apple Health, Google Fit)

## Support

For issues with:
- **Expo**: [Expo Documentation](https://docs.expo.dev)
- **Clerk**: [Clerk Documentation](https://clerk.com/docs)
- **NativeWind**: [NativeWind Documentation](https://www.nativewind.dev)
