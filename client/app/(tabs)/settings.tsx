import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleResetOnboarding = () => {
    // Navigate back to onboarding
    router.push('/onboarding/permissions');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(800)}
          className="px-8 pt-16 pb-8"
        >
          <Text className="text-4xl font-bold text-black mb-2">
            Settings
          </Text>
          <Text className="text-base text-gray-600">
            Manage your account and preferences
          </Text>
        </Animated.View>

        {/* Account Section */}
        <View className="px-8 mb-8">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Account
          </Text>
          
          <View className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
            <View className="flex-row items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-black items-center justify-center mr-4">
                <Text className="text-white text-2xl font-bold">
                  {user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-black">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="text-sm text-gray-600">
                  {user?.emailAddresses[0]?.emailAddress}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Onboarding Preferences */}
        <View className="px-8 mb-8">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Preferences
          </Text>
          
          <TouchableOpacity
            onPress={handleResetOnboarding}
            className="bg-white rounded-3xl p-6 border-2 border-gray-200 mb-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-black mb-1">
                  Reset Onboarding
                </Text>
                <Text className="text-sm text-gray-600">
                  Update your permissions, data sources, and triggers
                </Text>
              </View>
              <View className="w-6 h-6 bg-gray-200 rounded-full" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white rounded-3xl p-6 border-2 border-gray-200"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-black mb-1">
                  Notifications
                </Text>
                <Text className="text-sm text-gray-600">
                  Manage alert preferences
                </Text>
              </View>
              <View className="w-6 h-6 bg-gray-200 rounded-full" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy & Security */}
        <View className="px-8 mb-8">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Privacy & Security
          </Text>
          
          <View className="bg-gray-50 rounded-3xl p-6 border border-gray-200 mb-4">
            <Text className="text-sm text-gray-700 leading-6">
              <Text className="font-semibold">Your Privacy: </Text>
              All health data is encrypted and stored securely. We never sell or share your personal information with third parties.
            </Text>
          </View>

          <TouchableOpacity
            className="bg-white rounded-3xl p-6 border-2 border-gray-200"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-black mb-1">
                  Data & Privacy
                </Text>
                <Text className="text-sm text-gray-600">
                  View what data we collect and manage permissions
                </Text>
              </View>
              <View className="w-6 h-6 bg-gray-200 rounded-full" />
            </View>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View className="px-8 mb-8">
          <Text className="text-xs font-semibold text-gray-500 uppercase mb-3">
            About
          </Text>
          
          <View className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
            <Text className="text-sm text-gray-700 mb-2">
              <Text className="font-semibold">Migraine Guardian</Text>
            </Text>
            <Text className="text-xs text-gray-500 mb-4">
              Version 1.0.0
            </Text>
            <Text className="text-sm text-gray-600 leading-6">
              Your AI-powered companion for migraine prediction and prevention through passive health monitoring.
            </Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <View className="px-8 pb-8">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-black rounded-full py-5"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center text-lg font-semibold">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
