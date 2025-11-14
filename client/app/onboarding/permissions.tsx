import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';

interface Permission {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export default function PermissionsScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { setPermissions: savePermissions } = useOnboarding();

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isSignedIn]);

  const [permissions, setPermissions] = useState<Permission[]>([
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Receive alerts when migraine risk is high',
      enabled: false,
    },
    {
      id: 'passive',
      title: 'Passive Data Collection',
      description: 'Monitor screen time, activity, and phone usage patterns',
      enabled: false,
    },
    {
      id: 'calendar',
      title: 'Calendar Access',
      description: 'Analyze stress periods from your schedule',
      enabled: false,
    },
    {
      id: 'location',
      title: 'Location & Weather',
      description: 'Track environmental triggers like pressure and temperature',
      enabled: false,
    },
  ]);

  const togglePermission = (id: string) => {
    setPermissions(permissions.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const allEnabled = permissions.every(p => p.enabled);

  const handleContinue = () => {
    // Save permissions to context
    const permissionsData = {
      notifications: permissions.find(p => p.id === 'notifications')?.enabled || false,
      passiveData: permissions.find(p => p.id === 'passive')?.enabled || false,
      calendar: permissions.find(p => p.id === 'calendar')?.enabled || false,
      location: permissions.find(p => p.id === 'location')?.enabled || false,
    };

    savePermissions(permissionsData);
    router.push('/onboarding/data-sources');
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
          <Text className="text-4xl font-bold text-black mb-4">
            Permissions & Privacy
          </Text>
          <Text className="text-base text-gray-600 leading-6">
            We need these permissions to monitor your health passively. All data stays private and secure.
          </Text>
        </Animated.View>

        {/* Permission Cards */}
        <View className="px-8 pb-8">
          {permissions.map((permission, index) => (
            <Animated.View
              key={permission.id}
              entering={FadeInRight.duration(600).delay(index * 100)}
            >
              <TouchableOpacity
                onPress={() => togglePermission(permission.id)}
                className={`mb-4 p-6 rounded-3xl border-2 ${
                  permission.enabled 
                    ? 'bg-black border-black' 
                    : 'bg-white border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <Text className={`text-lg font-semibold ${
                      permission.enabled ? 'text-white' : 'text-black'
                    }`}>
                      {permission.title}
                    </Text>
                  </View>
                  <View className={`w-6 h-6 rounded-full border-2 ${
                    permission.enabled 
                      ? 'bg-white border-white' 
                      : 'bg-white border-gray-300'
                  }`}>
                    {permission.enabled && (
                      <Text className="text-black text-center text-xs leading-5">✓</Text>
                    )}
                  </View>
                </View>
                <Text className={`text-sm leading-5 ${
                  permission.enabled ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {permission.description}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Info Box */}
        <Animated.View 
          entering={FadeInDown.duration(800).delay(400)}
          className="mx-8 mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-200"
        >
          <Text className="text-sm text-gray-700 leading-6">
            <Text className="font-semibold">🔒 Privacy First: </Text>
            All data is processed locally on your device. We never sell or share your health information.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="px-8 pb-8 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!allEnabled}
          className={`rounded-full py-5 mb-3 ${
            allEnabled ? 'bg-black' : 'bg-gray-200'
          }`}
          activeOpacity={0.8}
        >
          <Text className={`text-center text-lg font-semibold ${
            allEnabled ? 'text-white' : 'text-gray-400'
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
