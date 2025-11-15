import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TriggersScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { setTriggers } = useOnboarding();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn]);

  const triggerOptions = [
    { id: 'stress', name: 'Stress & Anxiety', icon: 'alert-circle' },
    { id: 'screen_time', name: 'Screen Time', icon: 'phone-portrait' },
    { id: 'poor_sleep', name: 'Poor Sleep', icon: 'moon' },
    { id: 'loud_noise', name: 'Loud Noise', icon: 'volume-high' },
    { id: 'weather', name: 'Weather Changes', icon: 'cloud' },
    { id: 'hormones', name: 'Hormonal Changes', icon: 'fitness' },
    { id: 'caffeine', name: 'Caffeine', icon: 'cafe' },
    { id: 'alcohol', name: 'Alcohol', icon: 'wine' },
    { id: 'dehydration', name: 'Dehydration', icon: 'water' },
    { id: 'bright_light', name: 'Bright Light', icon: 'sunny' },
    { id: 'strong_smells', name: 'Strong Smells', icon: 'flower' },
    { id: 'physical_activity', name: 'Physical Activity', icon: 'barbell' },
    { id: 'skipped_meals', name: 'Skipped Meals', icon: 'restaurant' },
    { id: 'neck_tension', name: 'Neck/Shoulder Tension', icon: 'body' },
  ];

  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);

  const toggleTrigger = (triggerId: string) => {
    if (selectedTriggers.includes(triggerId)) {
      setSelectedTriggers(selectedTriggers.filter(id => id !== triggerId));
    } else {
      setSelectedTriggers([...selectedTriggers, triggerId]);
    }
  };

  const handleContinue = () => {
    setTriggers(selectedTriggers);
    router.push('/onboarding/data-sources');
  };

  const handleSkip = () => {
    setTriggers([]);
    router.push('/onboarding/data-sources');
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
            Known Triggers
          </Text>
          <Text className="text-sm text-gray-500 leading-5">
            Select triggers you've noticed. We'll track patterns for you.
          </Text>
        </Animated.View>

        {/* Trigger Grid */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="px-8 pb-6"
        >
          <View className="flex-row flex-wrap -mx-2">
            {triggerOptions.map((trigger, index) => {
              const isSelected = selectedTriggers.includes(trigger.id);
              return (
                <Animated.View
                  key={trigger.id}
                  entering={FadeInDown.duration(400).delay(100 + index * 30)}
                  className="w-1/2 px-2 mb-4"
                >
                  <TouchableOpacity
                    onPress={() => toggleTrigger(trigger.id)}
                    className={`p-4 rounded-2xl border-2 ${
                      isSelected 
                        ? 'bg-purple-50 border-purple-500' 
                        : 'bg-gray-50 border-gray-50'
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className={`w-11 h-11 rounded-full items-center justify-center mb-3 ${
                      isSelected ? 'bg-purple-500' : 'bg-gray-200'
                    }`}>
                      <Ionicons 
                        name={trigger.icon as any}
                        size={22} 
                        color={isSelected ? '#FFFFFF' : '#9CA3AF'} 
                      />
                    </View>
                    <Text className={`text-sm font-semibold ${
                      isSelected ? 'text-purple-700' : 'text-black'
                    }`}>
                      {trigger.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Info Box */}
        {selectedTriggers.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(600)}
            className="px-8 pb-8"
          >
            <View className="p-4 bg-blue-50 rounded-2xl flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" style={{ marginTop: 1, marginRight: 12 }} />
              <View className="flex-1">
                <Text className="text-xs text-gray-600 leading-5">
                  You've selected <Text className="font-semibold">{selectedTriggers.length} trigger{selectedTriggers.length > 1 ? 's' : ''}</Text>. We'll monitor these patterns and alert you when risk is high.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Note */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(700)}
          className="px-8 pb-8"
        >
          <View className="flex-row items-start p-4 bg-gray-50 rounded-2xl">
            <Ionicons name="bulb-outline" size={18} color="#6B7280" style={{ marginTop: 2, marginRight: 12 }} />
            <Text className="text-xs text-gray-600 flex-1 leading-5">
              Don't worry if you're not sure. We'll help you discover new triggers based on your patterns over time.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className="px-8 pb-8 space-y-3">
        <TouchableOpacity
          onPress={handleContinue}
          className="py-4 rounded-2xl bg-black"
          activeOpacity={0.8}
        >
          <Text className="text-center text-base font-semibold text-white">
            Continue
            {selectedTriggers.length > 0 && ` (${selectedTriggers.length})`}
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
