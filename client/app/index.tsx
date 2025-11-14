import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    // If user is already signed in, redirect to dashboard
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn]);

  const handleGetStarted = () => {
    // Go directly to onboarding
    router.push('/onboarding/permissions');
  };

  // Don't render the welcome screen if user is signed in
  if (!isLoaded || isSignedIn) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header Section */}
      <Animated.View 
        entering={FadeInUp.duration(1000).delay(200)}
        className="flex-1 justify-center items-center px-8"
      >
        {/* App Logo/Icon - Minimalist Circle */}
        <View className="mb-8">
          <View className="w-32 h-32 rounded-full border-4 border-black items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-black" />
          </View>
        </View>

        {/* App Name */}
        <Text className="text-5xl font-bold text-black mb-4 text-center">
          Migraine
        </Text>
        <Text className="text-5xl font-bold text-black mb-8 text-center">
          Guardian
        </Text>

        {/* Tagline */}
        <Text className="text-lg text-gray-600 text-center mb-4 px-4">
          Your passive AI companion for migraine prediction and prevention
        </Text>
        
        <Text className="text-sm text-gray-500 text-center px-8">
          Completely passive monitoring • No manual tracking required
        </Text>
      </Animated.View>

      {/* Bottom Section */}
      <Animated.View 
        entering={FadeInDown.duration(1000).delay(400)}
        className="px-8 pb-12"
      >
        {/* Get Started Button */}
        <TouchableOpacity
          onPress={handleGetStarted}
          className="bg-black rounded-full py-5 mb-4 shadow-lg"
          activeOpacity={0.8}
        >
          <Text className="text-white text-center text-lg font-semibold">
            Get Started
          </Text>
        </TouchableOpacity>

        {/* Privacy Note */}
        <Text className="text-xs text-gray-400 text-center px-4">
          Your health data stays private and secure on your device
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}
