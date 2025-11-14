import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import 'react-native-reanimated';
import '../global.css';
import { CLERK_PUBLISHABLE_KEY } from '../config/config';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import { DataCollectionProvider } from '../contexts/DataCollectionContext';
import { ThemeProvider } from '../contexts/ThemeContext';

// Token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value);
    } catch (error) {
      return;
    }
  },
};

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ThemeProvider>
        <OnboardingProvider>
          <DataCollectionProvider>
            <ClerkLoaded>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        >
          <Stack.Screen 
            name="index"
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen name="auth/sign-in" />
          <Stack.Screen name="auth/sign-up" />
          <Stack.Screen name="onboarding/permissions" />
          <Stack.Screen name="onboarding/data-sources" />
          <Stack.Screen name="onboarding/trigger-personalization" />
          <Stack.Screen name="onboarding/dashboard-intro" />
          <Stack.Screen 
            name="(tabs)"
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="dashboard"
            options={{
              animation: 'fade',
              gestureEnabled: false,
            }}
          />
        </Stack>
        <StatusBar style="dark" />
      </ClerkLoaded>
        </DataCollectionProvider>
      </OnboardingProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
