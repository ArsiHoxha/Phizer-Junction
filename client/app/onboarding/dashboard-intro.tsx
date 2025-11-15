import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser, useSignIn, useOAuth } from '@clerk/clerk-expo';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { onboardingAPI, setAuthToken, userAPI } from '../../services/api';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function DashboardIntroScreen() {
  const router = useRouter();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { onboardingData, clearOnboardingData } = useOnboarding();
  const [completing, setCompleting] = useState(false);

  // Redirect if already signed in (shouldn't normally reach here, but just in case)
  useEffect(() => {
    if (isLoaded && isSignedIn && !completing) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn, completing]);

  const saveOnboardingData = async () => {
    try {
      // Get auth token
      const token = await getToken();
      setAuthToken(token);

      // Save user to database
      if (user) {
        await userAPI.createOrUpdate({
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
        });
      }

      // Save all onboarding data
      if (onboardingData.permissions) {
        await onboardingAPI.savePermissions(onboardingData.permissions);
      }
      if (onboardingData.profile) {
        await onboardingAPI.saveProfile(onboardingData.profile);
      }
      if (onboardingData.menstrualTracking) {
        await onboardingAPI.saveMenstrualTracking(onboardingData.menstrualTracking);
      }
      if (onboardingData.triggers) {
        await onboardingAPI.saveTriggers(onboardingData.triggers);
      }
      if (onboardingData.dataSource) {
        await onboardingAPI.saveDataSource(onboardingData.dataSource);
      }
      
      // Mark onboarding as complete
      await onboardingAPI.complete();
      
      // Clear context data
      clearOnboardingData();
      
      // Navigate to dashboard tabs
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      Alert.alert('Error', 'Failed to save your data. Please try again.');
      throw error;
    }
  };

  const handleContinue = async () => {
    setCompleting(true);
    try {
      // Check if user is already signed in
      if (isSignedIn) {
        // User is already signed in, just save the data
        await saveOnboardingData();
        return;
      }

      // User not signed in, initiate Google OAuth
      const { createdSessionId, setActive } = await startOAuthFlow();
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        
        // Save data after successful sign-in
        await saveOnboardingData();
      }
    } catch (error: any) {
      console.error('Error with sign-in or saving data:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const features = [
    {
      title: 'Migraine Risk Index',
      description: 'Real-time prediction from 0-100% based on your health data',
    },
    {
      title: 'Trend Analytics',
      description: 'Visual charts tracking HRV, sleep, stress, and screen time',
    },
    {
      title: 'Trigger Insights',
      description: 'AI identifies your top contributing factors each day',
    },
    {
      title: 'Personalized Tips',
      description: 'Smart recommendations to prevent migraines before they start',
    },
    {
      title: 'Voice Alerts',
      description: 'Get notified when your risk level increases',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(800)}
          className="px-8 pt-16 pb-8"
        >
          <Text className="text-4xl font-bold text-black mb-4">
            Your Dashboard
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            Everything you need to stay ahead of migraines
          </Text>
        </Animated.View>

        {/* Preview Card */}
        <Animated.View 
          entering={FadeIn.duration(1000).delay(300)}
          className="mx-8 mb-8 p-8 bg-black rounded-3xl"
        >
          <View className="items-center">
            <Text className="text-gray-400 text-sm mb-2">MIGRAINE RISK INDEX</Text>
            <Text className="text-white text-7xl font-bold mb-2">34%</Text>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-green-400 mr-2" />
              <Text className="text-gray-300 text-base">Low Risk</Text>
            </View>
          </View>

          {/* Mini Chart Visualization */}
          <View className="mt-8 flex-row items-end justify-between h-20">
            {[40, 60, 45, 70, 50, 80, 34].map((height, index) => (
              <View
                key={index}
                className="flex-1 mx-1 bg-gray-700 rounded-t-lg"
                style={{ height: `${height}%` }}
              />
            ))}
          </View>
          <Text className="text-gray-400 text-xs text-center mt-2">Last 7 days</Text>
        </Animated.View>

        {/* Features List */}
        <View className="px-8 mb-8">
          <Text className="text-xl font-semibold text-black mb-6">
            What You'll Get
          </Text>
          {features.map((feature, index) => (
            <Animated.View
              key={index}
              entering={FadeInUp.duration(500).delay(400 + index * 100)}
              className="mb-5"
            >
              <View className="flex-1">
                <Text className="text-lg font-semibold text-black mb-1">
                  {feature.title}
                </Text>
                <Text className="text-sm text-gray-600 leading-5">
                  {feature.description}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* How It Works */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(800)}
          className="mx-8 mb-8 p-6 bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-200"
        >
          <Text className="text-base font-semibold text-black mb-3">
            How It Works
          </Text>
          <View className="space-y-3">
            <View className="flex-row items-start">
              <Text className="text-gray-900 font-bold mr-3">1.</Text>
              <Text className="text-sm text-gray-700 flex-1 leading-5">
                We passively monitor your health metrics 24/7
              </Text>
            </View>
            <View className="flex-row items-start mt-2">
              <Text className="text-gray-900 font-bold mr-3">2.</Text>
              <Text className="text-sm text-gray-700 flex-1 leading-5">
                AI analyzes patterns and predicts migraine risk
              </Text>
            </View>
            <View className="flex-row items-start mt-2">
              <Text className="text-gray-900 font-bold mr-3">3.</Text>
              <Text className="text-sm text-gray-700 flex-1 leading-5">
                You receive personalized tips and alerts to prevent attacks
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Remember Box */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(1000)}
          className="mx-8 mb-8 p-6 bg-black rounded-3xl"
        >
          <Text className="text-white font-semibold text-base mb-2">
            Remember
          </Text>
          <Text className="text-gray-300 text-sm leading-6">
            Everything happens automatically. Just live your life, and we'll watch over your health.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="px-8 pb-8 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={completing}
          className="bg-black rounded-full py-5 mb-3 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          {completing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              {isSignedIn ? 'Continue to Dashboard' : 'Sign in with Google'}
            </Text>
          )}
        </TouchableOpacity>
        
        <Text className="text-xs text-gray-500 text-center px-4 mb-3">
          {isSignedIn 
            ? 'Your data will be saved securely to your account' 
            : 'Sign in to save your data securely and sync across devices'}
        </Text>
        
        <TouchableOpacity
          onPress={() => router.back()}
          className="py-3"
          disabled={completing}
        >
          <Text className="text-gray-500 text-center">Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
