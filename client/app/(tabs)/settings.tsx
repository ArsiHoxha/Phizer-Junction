import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { useDataCollection } from '../../contexts/DataCollectionContext';

// Helper Components
interface MonitoringToggleProps {
  title: string;
  description: string;
  enabled: boolean;
  colors: any;
  isDark: boolean;
  badge?: string;
}

const MonitoringToggle: React.FC<MonitoringToggleProps> = ({ 
  title, 
  description, 
  enabled, 
  colors, 
  badge 
}) => {
  return (
    <View className="p-4">
      <View className="flex-row items-center justify-between mb-1.5">
        <View className="flex-row items-center flex-1">
          <Text style={{ color: colors.text }} className="text-sm font-semibold flex-1">
            {title}
          </Text>
          {badge && (
            <View className="bg-blue-100 px-2 py-0.5 rounded-full ml-2">
              <Text className="text-blue-600 text-[10px] font-semibold">{badge}</Text>
            </View>
          )}
        </View>
        <View className={`w-9 h-5 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'} justify-center ${enabled ? 'items-end' : 'items-start'} px-0.5`}>
          <View className="w-4 h-4 rounded-full bg-white" />
        </View>
      </View>
      <Text style={{ color: colors.textSecondary }} className="text-xs">
        {description}
      </Text>
    </View>
  );
};

const Divider: React.FC<{ colors: any }> = ({ colors }) => {
  return <View style={{ backgroundColor: colors.border }} className="h-px mx-5" />;
};

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { theme, isDark, colors, setTheme } = useTheme();
  const { isCollecting } = useDataCollection();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleResetOnboarding = () => {
    router.push('/onboarding/permissions');
  };

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(800)}
          className="px-6 pt-8 pb-6"
        >
          <Text style={{ color: colors.text }} className="text-3xl font-bold mb-2">
            Settings
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-base">
            Manage your preferences and monitoring
          </Text>
        </Animated.View>

        {/* Account Section */}
        <View className="px-6 mb-6">
          <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-3">
            Account
          </Text>
          
          <View style={{ 
            backgroundColor: isDark ? '#000000' : colors.card, 
            borderColor: isDark ? '#2D2D2D' : colors.border 
          }} className="rounded-3xl p-4 border">
            <View className="flex-row items-center mb-3">
              <View style={{ backgroundColor: isDark ? '#FFFFFF' : colors.primary }} className="w-12 h-12 rounded-full items-center justify-center mr-3">
                <Text style={{ color: isDark ? '#000000' : '#FFFFFF' }} className="text-lg font-bold">
                  {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-base font-semibold mb-0.5">
                  {user?.firstName || 'User'}
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs">
                  {user?.emailAddresses[0]?.emailAddress}
                </Text>
              </View>
            </View>
            
            {/* Data Collection Status */}
            <View style={{ 
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
              borderColor: isDark ? '#2D2D2D' : 'transparent'
            }} className="rounded-2xl p-3 flex-row items-center justify-between border">
              <View className="flex-row items-center">
                <View className={`w-2 h-2 rounded-full ${isCollecting ? 'bg-green-500' : 'bg-gray-400'} mr-2`} />
                <Text style={{ color: colors.text }} className="text-xs font-medium">
                  Passive Monitoring
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary }} className="text-xs">
                {isCollecting ? 'Active' : 'Paused'}
              </Text>
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View className="px-6 mb-6">
          <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-3">
            Appearance
          </Text>
          
          <View style={{ 
            backgroundColor: isDark ? '#000000' : colors.card, 
            borderColor: isDark ? '#2D2D2D' : colors.border 
          }} className="rounded-3xl p-4 border">
            <Text style={{ color: colors.text }} className="text-sm font-semibold mb-3">
              Theme
            </Text>
            
            <View style={{ backgroundColor: isDark ? '#1a1a1a' : '#f3f4f6' }} className="flex-row rounded-full p-1">
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setTheme(option.value)}
                  style={{
                    backgroundColor: theme === option.value ? (isDark ? '#FFFFFF' : '#000000') : 'transparent',
                  }}
                  className="flex-1 py-2 rounded-full items-center"
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: theme === option.value ? (isDark ? '#000000' : '#FFFFFF') : colors.text,
                      fontWeight: theme === option.value ? '600' : '400',
                      fontSize: 13,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Passive Monitoring Section */}
        <View className="px-6 mb-6">
          <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-3">
            Passive Monitoring
          </Text>
          
          <View style={{ 
            backgroundColor: isDark ? '#000000' : colors.card, 
            borderColor: isDark ? '#2D2D2D' : colors.border 
          }} className="rounded-3xl border overflow-hidden">
            <MonitoringToggle
              title="HRV & Heart Rate"
              description="Real-time cardiovascular monitoring for early warning"
              enabled={true}
              colors={colors}
              isDark={isDark}
            />
            <Divider colors={colors} />
            <MonitoringToggle
              title="Sleep Tracking"
              description="Analyze sleep quality, duration, and debt"
              enabled={true}
              colors={colors}
              isDark={isDark}
            />
            <Divider colors={colors} />
            <MonitoringToggle
              title="Screen Time Analysis"
              description="Monitor phone usage and digital stress"
              enabled={true}
              colors={colors}
              isDark={isDark}
            />
            <Divider colors={colors} />
            <MonitoringToggle
              title="Weather Monitoring"
              description="Track atmospheric changes and UV exposure"
              enabled={true}
              colors={colors}
              isDark={isDark}
            />
            <Divider colors={colors} />
            <MonitoringToggle
              title="Calendar Stress"
              description="Analyze meeting patterns and busy periods"
              enabled={true}
              colors={colors}
              isDark={isDark}
            />
            <Divider colors={colors} />
            <MonitoringToggle
              title="Activity Tracking"
              description="Monitor physical activity and sedentary time"
              enabled={true}
              colors={colors}
              isDark={isDark}
            />
            <Divider colors={colors} />
            <MonitoringToggle
              title="Caffeine Intake"
              description="Log coffee/tea consumption automatically"
              enabled={false}
              colors={colors}
              isDark={isDark}
              badge="Beta"
            />
            <Divider colors={colors} />
            <MonitoringToggle
              title="Meal Timing"
              description="Track eating patterns and fasting windows"
              enabled={false}
              colors={colors}
              isDark={isDark}
              badge="Beta"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-3">
            Quick Actions
          </Text>
          
          <TouchableOpacity
            onPress={handleResetOnboarding}
            style={{ 
              backgroundColor: isDark ? '#000000' : colors.card, 
              borderColor: isDark ? '#2D2D2D' : colors.border 
            }}
            className="rounded-3xl p-4 border mb-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-sm font-semibold mb-0.5">
                  Reset Onboarding
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs">
                  Update permissions and preferences
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary }} className="text-xl">→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ 
              backgroundColor: isDark ? '#000000' : colors.card, 
              borderColor: isDark ? '#2D2D2D' : colors.border 
            }}
            className="rounded-3xl p-4 border"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text style={{ color: colors.text }} className="text-sm font-semibold mb-0.5">
                  Export Data
                </Text>
                <Text style={{ color: colors.textSecondary }} className="text-xs">
                  Download your health records
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary }} className="text-xl">→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy */}
        <View className="px-6 mb-6">
          <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-3">
            Privacy & Security
          </Text>
          
          <View style={{ 
            backgroundColor: isDark ? '#000000' : colors.card, 
            borderColor: isDark ? '#2D2D2D' : colors.border 
          }} className="rounded-3xl p-4 border">
            <Text style={{ color: colors.text }} className="text-xs leading-5">
              All health data is encrypted end-to-end and stored securely. We never sell or share your personal information.
            </Text>
          </View>
        </View>

        {/* Sign Out */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={handleSignOut}
            style={{ backgroundColor: colors.error }}
            className="rounded-full py-4"
            activeOpacity={0.8}
          >
            <Text className="text-white text-center font-semibold">
              Sign Out
            </Text>
          </TouchableOpacity>
          
          <Text style={{ color: colors.textSecondary }} className="text-xs text-center mt-4">
            Version 1.0.0 • Made with care for migraine sufferers
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
