import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';

export default function DataSourcesScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { setDataSource: saveDataSource } = useOnboarding();

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn]);

  const [selectedMode, setSelectedMode] = useState<'phone' | 'wearable' | null>(null);
  const [wearableType, setWearableType] = useState<string | null>(null);

  const wearables = [
    { id: 'apple', name: 'Apple Watch' },
    { id: 'fitbit', name: 'Fitbit' },
    { id: 'garmin', name: 'Garmin' },
    { id: 'samsung', name: 'Samsung Galaxy' },
    { id: 'none', name: 'Simulate Data' },
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
            Data Sources
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            Choose how you'd like to monitor your health data
          </Text>
        </Animated.View>

        {/* Mode Selection */}
        <View className="px-8 mb-8">
          <Animated.View entering={FadeInUp.duration(600).delay(200)}>
            <TouchableOpacity
              onPress={() => setSelectedMode('phone')}
              className={`mb-4 p-8 rounded-3xl border-2 ${
                selectedMode === 'phone'
                  ? 'bg-black border-black'
                  : 'bg-white border-gray-200'
              }`}
              activeOpacity={0.7}
            >
              <View className="items-center">
                <Text className={`text-2xl font-bold mb-2 ${
                  selectedMode === 'phone' ? 'text-white' : 'text-black'
                }`}>
                  Phone Only
                </Text>
                <Text className={`text-sm text-center leading-6 ${
                  selectedMode === 'phone' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Monitor screen time, activity patterns, sleep from phone sensors
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(600).delay(300)}>
            <TouchableOpacity
              onPress={() => setSelectedMode('wearable')}
              className={`mb-6 p-8 rounded-3xl border-2 ${
                selectedMode === 'wearable'
                  ? 'bg-black border-black'
                  : 'bg-white border-gray-200'
              }`}
              activeOpacity={0.7}
            >
              <View className="items-center">
                <Text className={`text-2xl font-bold mb-2 ${
                  selectedMode === 'wearable' ? 'text-white' : 'text-black'
                }`}>
                  Connect Wearable
                </Text>
                <Text className={`text-sm text-center leading-6 ${
                  selectedMode === 'wearable' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Enhanced monitoring with HRV, heart rate, and sleep tracking
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Wearable Options */}
        {selectedMode === 'wearable' && (
          <Animated.View 
            entering={FadeInDown.duration(600)}
            className="px-8 mb-8"
          >
            <Text className="text-lg font-semibold text-black mb-4">
              Select Your Device
            </Text>
            {wearables.map((device, index) => (
              <Animated.View
                key={device.id}
                entering={FadeInUp.duration(400).delay(index * 50)}
              >
                <TouchableOpacity
                  onPress={() => setWearableType(device.id)}
                  className={`mb-3 p-5 rounded-2xl border-2 flex-row items-center justify-between ${
                    wearableType === device.id
                      ? 'bg-gray-900 border-gray-900'
                      : 'bg-white border-gray-200'
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <Text className={`text-base font-medium ${
                      wearableType === device.id ? 'text-white' : 'text-black'
                    }`}>
                      {device.name}
                    </Text>
                  </View>
                  {wearableType === device.id && (
                    <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
                      <Text className="text-black text-xs">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Info Box */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(400)}
          className="mx-8 mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-200"
        >
          <Text className="text-sm text-gray-700 leading-6">
            <Text className="font-semibold">💡 Note: </Text>
            {selectedMode === 'wearable' 
              ? "We'll simulate wearable data if no device is connected. HRV and heart rate patterns will be generated realistically."
              : "Phone-only mode provides excellent tracking through motion sensors, screen time, and usage patterns."
            }
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="px-8 pb-8 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={() => {
            if (!selectedMode) return;
            
            saveDataSource({
              mode: selectedMode,
              wearableType: selectedMode === 'wearable' ? wearableType || undefined : undefined,
            });
            
            router.push('/onboarding/trigger-personalization');
          }}
          disabled={!selectedMode}
          className={`rounded-full py-5 mb-3 ${
            selectedMode ? 'bg-black' : 'bg-gray-200'
          }`}
          activeOpacity={0.8}
        >
          <Text className={`text-center text-lg font-semibold ${
            selectedMode ? 'text-white' : 'text-gray-400'
          }`}>
            Continue
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.back()}
          className="py-3"
        >
          <Text className="text-gray-500 text-center">Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
