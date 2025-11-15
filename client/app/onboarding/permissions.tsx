import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Permission {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
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
      description: 'Get alerts for high risk',
      icon: 'notifications-outline',
      enabled: false,
    },
    {
      id: 'passive',
      title: 'Background Monitoring',
      description: 'Track activity patterns',
      icon: 'pulse-outline',
      enabled: false,
    },
    {
      id: 'location',
      title: 'Location & Weather',
      description: 'Monitor environment',
      icon: 'location-outline',
      enabled: false,
    },
  ]);

  const togglePermission = (id: string) => {
    setPermissions(permissions.map(p => 
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handleContinue = () => {
    const permissionsData = {
      notifications: permissions.find(p => p.id === 'notifications')?.enabled || false,
      passiveData: permissions.find(p => p.id === 'passive')?.enabled || false,
      location: permissions.find(p => p.id === 'location')?.enabled || false,
    };

    savePermissions(permissionsData);
    router.push('/onboarding/profile');
  };

  const handleSkip = () => {
    savePermissions({
      notifications: false,
      passiveData: false,
      location: false,
    });
    router.push('/onboarding/profile');
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
            Permissions
          </Text>
          <Text className="text-sm text-gray-500 leading-5">
            Optional. Enable what you're comfortable with.
          </Text>
        </Animated.View>

        {/* Permission Cards */}
        <View className="px-8 pb-8 space-y-3">
          {permissions.map((permission, index) => (
            <Animated.View
              key={permission.id}
              entering={FadeInDown.duration(400).delay(index * 100)}
            >
              <TouchableOpacity
                onPress={() => togglePermission(permission.id)}
                className="flex-row items-center p-4 bg-gray-50 rounded-2xl"
                activeOpacity={0.7}
              >
                <View className={`w-11 h-11 rounded-full items-center justify-center ${
                  permission.enabled ? 'bg-blue-500' : 'bg-gray-200'
                }`}>
                  <Ionicons 
                    name={permission.enabled ? permission.icon.replace('-outline', '') as any : permission.icon} 
                    size={22} 
                    color={permission.enabled ? '#FFFFFF' : '#9CA3AF'} 
                  />
                </View>

                <View className="flex-1 ml-4">
                  <Text className="text-base font-semibold text-black mb-0.5">
                    {permission.title}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {permission.description}
                  </Text>
                </View>

                <View className={`w-12 h-7 rounded-full p-1 ${
                  permission.enabled ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                  <View className={`w-5 h-5 bg-white rounded-full ${
                    permission.enabled ? 'ml-auto' : 'ml-0'
                  }`} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Info Box */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(400)}
          className="px-8 pb-8"
        >
          <View className="flex-row items-start p-4 bg-blue-50 rounded-2xl">
            <Ionicons name="information-circle" size={20} color="#3B82F6" style={{ marginTop: 2, marginRight: 12 }} />
            <Text className="text-xs text-gray-600 flex-1 leading-5">
              You can change these anytime in Settings. All data is encrypted and never shared.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="px-8 pb-8 space-y-3">
        <TouchableOpacity
          onPress={handleContinue}
          className="bg-black py-4 rounded-2xl"
          activeOpacity={0.8}
        >
          <Text className="text-white text-center text-base font-semibold">
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
