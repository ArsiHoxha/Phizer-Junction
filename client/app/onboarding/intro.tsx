import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Dimensions, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
  iconColor: string;
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'shield-checkmark',
    title: 'AI-Powered Migraine Prediction',
    description: 'Our advanced AI analyzes your health data, lifestyle patterns, and environmental factors to predict migraine risks before they happen.',
    gradient: ['#3B82F6', '#1E40AF'],
    iconColor: '#3B82F6',
  },
  {
    id: '2',
    icon: 'fitness',
    title: 'Comprehensive Health Tracking',
    description: 'Monitor heart rate variability, sleep quality, stress levels, and more. Connect with Apple Health or use your phone sensors for seamless data collection.\n\nNote: Apple Health integration is in beta - we couldn\'t fully test it as we didn\'t have an Apple Watch available.',
    gradient: ['#10B981', '#059669'],
    iconColor: '#10B981',
  },
  {
    id: '3',
    icon: 'analytics',
    title: 'Personalized Insights',
    description: 'Discover your unique migraine triggers and patterns. Get real-time alerts and actionable recommendations tailored to your lifestyle.',
    gradient: ['#F59E0B', '#D97706'],
    iconColor: '#F59E0B',
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      // Go to the actual onboarding flow
      router.push('/onboarding/permissions');
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/permissions');
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={{ width, height: height * 0.85 }} className="items-center justify-center px-8">
      <Animated.View 
        entering={FadeInDown.duration(800)}
        className="items-center mb-12"
      >
        {/* Icon Container with Gradient */}
        <View
          style={{
            backgroundColor: `${item.iconColor}20`,
            shadowColor: item.iconColor,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
          className="w-32 h-32 rounded-full items-center justify-center mb-8"
        >
          <Ionicons name={item.icon} size={64} color={item.iconColor} />
        </View>

        {/* Slide Number */}
        <View className="flex-row items-center mb-6">
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: idx === index ? item.iconColor : '#E5E7EB',
                width: idx === index ? 24 : 8,
              }}
              className={`h-2 rounded-full mx-1 ${idx === index ? 'w-6' : 'w-2'}`}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(800).delay(200)} className="items-center">
        <Text className="text-3xl font-bold text-black mb-4 text-center">
          {item.title}
        </Text>
        <Text className="text-base text-gray-600 text-center leading-6">
          {item.description}
        </Text>
      </Animated.View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          onPress={handleSkip}
          className="absolute top-16 right-6 z-10"
          activeOpacity={0.7}
        >
          <Text className="text-gray-600 text-base font-semibold">Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        bounces={false}
      />

      {/* Navigation Buttons */}
      <View className="px-8 pb-12">
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: slides[currentIndex].iconColor,
            shadowColor: slides[currentIndex].iconColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
          className="rounded-full py-5 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Text className="text-white text-center text-lg font-semibold mr-2">
            {currentIndex === slides.length - 1 ? "Let's Get Started" : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Progress Text */}
        <Text className="text-center text-gray-500 text-sm mt-4">
          {currentIndex + 1} of {slides.length}
        </Text>
      </View>
    </View>
  );
}
