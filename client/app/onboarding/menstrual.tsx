import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, SafeAreaView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function MenstrualTrackingScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { setMenstrualTracking } = useOnboarding();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn]);

  const [enableTracking, setEnableTracking] = useState(false);
  const [cycleLength, setCycleLength] = useState('28');
  const [lastPeriodDays, setLastPeriodDays] = useState('');

  const canContinue = !enableTracking || (cycleLength && parseInt(cycleLength) >= 21 && parseInt(cycleLength) <= 35);

  const handleContinue = () => {
    const trackingData = {
      enabled: enableTracking,
      cycleLength: enableTracking ? parseInt(cycleLength) : 28,
      lastPeriodDate: enableTracking && lastPeriodDays 
        ? new Date(Date.now() - parseInt(lastPeriodDays) * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };

    setMenstrualTracking(trackingData);
    router.push('/onboarding/triggers');
  };

  const handleSkip = () => {
    setMenstrualTracking({ enabled: false });
    router.push('/onboarding/triggers');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(600)}
          className="px-8 pt-12 pb-8"
        >
          <Text className="text-3xl font-bold text-black mb-3">
            Cycle Tracking
          </Text>
          <Text className="text-sm text-gray-500 leading-5">
            Track hormonal patterns that may trigger migraines
          </Text>
        </Animated.View>

        {/* Enable Toggle */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="px-8 pb-6"
        >
          <TouchableOpacity
            onPress={() => setEnableTracking(!enableTracking)}
            className={`flex-row items-center p-5 rounded-2xl border-2 ${
              enableTracking ? 'bg-pink-50 border-pink-500' : 'bg-gray-50 border-gray-50'
            }`}
            activeOpacity={0.7}
          >
            <View className={`w-12 h-12 rounded-full items-center justify-center ${
              enableTracking ? 'bg-pink-500' : 'bg-gray-200'
            }`}>
              <Ionicons 
                name={enableTracking ? "calendar" : "calendar-outline"}
                size={24} 
                color={enableTracking ? '#FFFFFF' : '#9CA3AF'} 
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className={`text-base font-semibold mb-1 ${
                enableTracking ? 'text-pink-700' : 'text-black'
              }`}>
                Enable Menstrual Tracking
              </Text>
              <Text className="text-xs text-gray-500">
                Predict hormonal migraine patterns
              </Text>
            </View>

            <View className={`w-12 h-7 rounded-full p-1 ${
              enableTracking ? 'bg-pink-500' : 'bg-gray-300'
            }`}>
              <View className={`w-5 h-5 bg-white rounded-full ${
                enableTracking ? 'ml-auto' : 'ml-0'
              }`} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Conditional Form */}
        {enableTracking && (
          <>
            {/* Cycle Length */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              className="px-8 pb-6"
            >
              <Text className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">
                Average Cycle Length
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-2xl p-4 border-2 border-gray-50">
                <Ionicons name="time-outline" size={22} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-black"
                  placeholder="28"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={cycleLength}
                  onChangeText={setCycleLength}
                  maxLength={2}
                />
                <Text className="text-sm text-gray-500">days</Text>
              </View>
              {cycleLength && (parseInt(cycleLength) < 21 || parseInt(cycleLength) > 35) && (
                <Text className="text-xs text-red-500 mt-2 ml-1">
                  Typical cycle length is 21-35 days
                </Text>
              )}
            </Animated.View>

            {/* Last Period */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(300)}
              className="px-8 pb-6"
            >
              <Text className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">
                Last Period Started (Optional)
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-2xl p-4 border-2 border-gray-50">
                <Ionicons name="calendar-outline" size={22} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-base text-black"
                  placeholder="Days ago (e.g., 7)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={lastPeriodDays}
                  onChangeText={setLastPeriodDays}
                  maxLength={3}
                />
              </View>
            </Animated.View>

            {/* Features List */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(400)}
              className="px-8 pb-6"
            >
              <View className="p-5 bg-pink-50 rounded-2xl">
                <Text className="text-sm font-semibold text-pink-900 mb-3">
                  What You'll Get:
                </Text>
                <View className="space-y-2">
                  <View className="flex-row items-start">
                    <Ionicons name="checkmark-circle" size={18} color="#EC4899" style={{ marginRight: 8, marginTop: 1 }} />
                    <Text className="text-xs text-gray-700 flex-1 leading-5">
                      Predict hormonal migraine patterns
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Ionicons name="checkmark-circle" size={18} color="#EC4899" style={{ marginRight: 8, marginTop: 1 }} />
                    <Text className="text-xs text-gray-700 flex-1 leading-5">
                      Track period vs. migraine correlation
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Ionicons name="checkmark-circle" size={18} color="#EC4899" style={{ marginRight: 8, marginTop: 1 }} />
                    <Text className="text-xs text-gray-700 flex-1 leading-5">
                      Integration with Apple Health cycle tracking
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Ionicons name="checkmark-circle" size={18} color="#EC4899" style={{ marginRight: 8, marginTop: 1 }} />
                    <Text className="text-xs text-gray-700 flex-1 leading-5">
                      Receive alerts during high-risk cycle phases
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </>
        )}

        {/* Privacy Note */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(500)}
          className="px-8 pb-8"
        >
          <View className="flex-row items-start p-4 bg-blue-50 rounded-2xl">
            <Ionicons name="lock-closed" size={18} color="#3B82F6" style={{ marginTop: 2, marginRight: 12 }} />
            <Text className="text-xs text-gray-600 flex-1 leading-5">
              Your cycle data is private and encrypted. You can enable/disable tracking anytime in Settings.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className="px-8 pb-8 space-y-3">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          className={`py-4 rounded-2xl ${
            canContinue ? 'bg-black' : 'bg-gray-200'
          }`}
          activeOpacity={0.8}
        >
          <Text className={`text-center text-base font-semibold ${
            canContinue ? 'text-white' : 'text-gray-400'
          }`}>
            Continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          className="py-3"
          activeOpacity={0.6}
        >
          <Text className="text-gray-500 text-center text-sm">
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
