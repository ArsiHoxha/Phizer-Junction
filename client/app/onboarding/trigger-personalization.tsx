import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface Trigger {
  id: string;
  name: string;
  selected: boolean;
}

export default function TriggerPersonalizationScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { setTriggers: saveTriggers } = useOnboarding();

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn]);

  const [frequency, setFrequency] = useState<string>('');
  const [triggers, setTriggers] = useState<Trigger[]>([
    { id: 'stress', name: 'Stress', selected: false },
    { id: 'screen', name: 'Screen Time', selected: false },
    { id: 'sleep', name: 'Poor Sleep', selected: false },
    { id: 'noise', name: 'Loud Noise', selected: false },
    { id: 'weather', name: 'Weather Changes', selected: false },
    { id: 'hormones', name: 'Hormonal', selected: false },
    { id: 'food', name: 'Food & Drink', selected: false },
    { id: 'light', name: 'Bright Light', selected: false },
  ]);

  const frequencies = [
    { id: 'rare', label: 'Rarely', subtitle: 'Less than once a month' },
    { id: 'occasional', label: 'Occasionally', subtitle: '1-4 times a month' },
    { id: 'frequent', label: 'Frequently', subtitle: '5-15 times a month' },
    { id: 'chronic', label: 'Chronic', subtitle: '15+ times a month' },
  ];

  const toggleTrigger = (id: string) => {
    setTriggers(triggers.map(t => 
      t.id === id ? { ...t, selected: !t.selected } : t
    ));
  };

  const canContinue = frequency && triggers.some(t => t.selected);

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
            Personalize Your Experience
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            Help us understand your migraine patterns better
          </Text>
        </Animated.View>

        {/* Frequency Section */}
        <View className="px-8 mb-8">
          <Text className="text-xl font-semibold text-black mb-4">
            How often do you experience migraines?
          </Text>
          {frequencies.map((freq, index) => (
            <Animated.View
              key={freq.id}
              entering={FadeInRight.duration(500).delay(index * 100)}
            >
              <TouchableOpacity
                onPress={() => setFrequency(freq.id)}
                className={`mb-3 p-5 rounded-2xl border-2 ${
                  frequency === freq.id
                    ? 'bg-black border-black'
                    : 'bg-white border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className={`text-lg font-semibold mb-1 ${
                      frequency === freq.id ? 'text-white' : 'text-black'
                    }`}>
                      {freq.label}
                    </Text>
                    <Text className={`text-sm ${
                      frequency === freq.id ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {freq.subtitle}
                    </Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 ${
                    frequency === freq.id
                      ? 'bg-white border-white'
                      : 'bg-white border-gray-300'
                  }`}>
                    {frequency === freq.id && (
                      <Text className="text-black text-center text-xs leading-5">✓</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Triggers Section */}
        <View className="px-8 mb-8">
          <Text className="text-xl font-semibold text-black mb-2">
            Known Triggers
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            Select all that apply (you can change these later)
          </Text>
          
          <View className="flex-row flex-wrap -mx-2">
            {triggers.map((trigger, index) => (
              <Animated.View
                key={trigger.id}
                entering={FadeInDown.duration(400).delay(index * 50)}
                className="w-1/2 px-2 mb-3"
              >
                <TouchableOpacity
                  onPress={() => toggleTrigger(trigger.id)}
                  className={`p-5 rounded-2xl border-2 items-center ${
                    trigger.selected
                      ? 'bg-black border-black'
                      : 'bg-white border-gray-200'
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-sm font-medium text-center ${
                    trigger.selected ? 'text-white' : 'text-black'
                  }`}>
                    {trigger.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Info Box */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(400)}
          className="mx-8 mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-200"
        >
          <Text className="text-sm text-gray-700 leading-6">
            <Text className="font-semibold">🎯 AI Learning: </Text>
            Our AI will learn your unique patterns over time and may discover triggers you didn't know about.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="px-8 pb-8 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={() => {
            if (!canContinue) return;
            
            const selectedTriggers = triggers
              .filter(t => t.selected)
              .map(t => t.id);
            
            saveTriggers({
              frequency,
              triggers: selectedTriggers,
            });
            
            router.push('/onboarding/dashboard-intro');
          }}
          disabled={!canContinue}
          className={`rounded-full py-5 mb-3 ${
            canContinue ? 'bg-black' : 'bg-gray-200'
          }`}
          activeOpacity={0.8}
        >
          <Text className={`text-center text-lg font-semibold ${
            canContinue ? 'text-white' : 'text-gray-400'
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
