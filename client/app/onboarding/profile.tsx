import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, SafeAreaView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ProfileScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { setProfile } = useOnboarding();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn]);

  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [age, setAge] = useState('');

  const genderOptions = [
    { id: 'female', label: 'Female', icon: 'woman' },
    { id: 'male', label: 'Male', icon: 'man' },
    { id: 'other', label: 'Other', icon: 'people' },
    { id: 'prefer-not-to-say', label: 'Prefer not to say', icon: 'help-circle-outline' },
  ];

  const canContinue = selectedGender && age && parseInt(age) >= 13 && parseInt(age) <= 120;

  const handleContinue = () => {
    if (!canContinue) return;

    const profileData = {
      gender: selectedGender,
      age: parseInt(age),
    };

    setProfile(profileData);
    
    // If female, go to menstrual tracking, otherwise go to triggers
    if (selectedGender === 'female') {
      router.push('/onboarding/menstrual');
    } else {
      router.push('/onboarding/triggers');
    }
  };

  const handleSkip = () => {
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
            About You
          </Text>
          <Text className="text-sm text-gray-500 leading-5">
            Help us personalize your experience
          </Text>
        </Animated.View>

        {/* Gender Selection */}
        <View className="px-8 pb-8">
          <Text className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">
            Gender
          </Text>
          <View className="space-y-2">
            {genderOptions.map((option, index) => (
              <Animated.View
                key={option.id}
                entering={FadeInDown.duration(400).delay(index * 80)}
              >
                <TouchableOpacity
                  onPress={() => setSelectedGender(option.id)}
                  className={`flex-row items-center p-4 rounded-2xl border-2 ${
                    selectedGender === option.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-50'
                  }`}
                  activeOpacity={0.7}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${
                    selectedGender === option.id ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    <Ionicons 
                      name={option.icon as any}
                      size={20} 
                      color={selectedGender === option.id ? '#FFFFFF' : '#9CA3AF'} 
                    />
                  </View>
                  <Text className={`ml-4 text-base font-medium ${
                    selectedGender === option.id ? 'text-blue-700' : 'text-black'
                  }`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Age Input */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          className="px-8 pb-8"
        >
          <Text className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">
            Age
          </Text>
          <View className="flex-row items-center bg-gray-50 rounded-2xl p-4 border-2 border-gray-50">
            <Ionicons name="calendar-outline" size={22} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-black"
              placeholder="Enter your age"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
              maxLength={3}
            />
            {age && parseInt(age) >= 13 && parseInt(age) <= 120 && (
              <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            )}
          </View>
          {age && (parseInt(age) < 13 || parseInt(age) > 120) && (
            <Text className="text-xs text-red-500 mt-2 ml-1">
              Please enter a valid age (13-120)
            </Text>
          )}
        </Animated.View>

        {/* Info Note */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(500)}
          className="px-8 pb-8"
        >
          <View className="flex-row items-start p-4 bg-blue-50 rounded-2xl">
            <Ionicons name="information-circle" size={20} color="#3B82F6" style={{ marginTop: 2, marginRight: 12 }} />
            <Text className="text-xs text-gray-600 flex-1 leading-5">
              This helps us provide age-appropriate predictions and track hormonal patterns if applicable.
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
