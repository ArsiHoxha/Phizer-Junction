import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { useDataCollection } from '../../contexts/DataCollectionContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppleHealthService from '../../services/appleHealthService';
import WidgetDataService from '../../services/widgetDataService';
import { Linking } from 'react-native';

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

  // Apple Health state
  const [appleHealthConnected, setAppleHealthConnected] = useState(false);
  const [appleHealthLoading, setAppleHealthLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Widget state
  const [widgetLastUpdate, setWidgetLastUpdate] = useState<string | null>(null);
  const [showWidgetInstructions, setShowWidgetInstructions] = useState(false);

  useEffect(() => {
    loadAppleHealthStatus();
    loadWidgetStatus();
  }, []);

  const loadWidgetStatus = async () => {
    try {
      const widgetData = await WidgetDataService.getWidgetData();
      if (widgetData) {
        setWidgetLastUpdate(widgetData.lastUpdate);
      }
    } catch (error) {
      console.error('Error loading widget status:', error);
    }
  };

  const loadAppleHealthStatus = async () => {
    try {
      const connected = await AsyncStorage.getItem('apple_health_connected');
      const lastSync = await AsyncStorage.getItem('apple_health_last_sync');
      setAppleHealthConnected(connected === 'true');
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error('Error loading Apple Health status:', error);
    }
  };

  const handleConnectAppleHealth = async () => {
    if (Platform.OS !== 'ios') {
      alert('Apple Health is only available on iOS devices');
      return;
    }

    setAppleHealthLoading(true);
    try {
      const success = await AppleHealthService.initHealth();
      if (success) {
        setAppleHealthConnected(true);
        await AsyncStorage.setItem('apple_health_connected', 'true');
        
        // Fetch initial data
        const metrics = await AppleHealthService.getLatestMetrics();
        console.log('Apple Health metrics:', metrics);
        
        // Update last sync time
        const now = new Date().toISOString();
        setLastSyncTime(now);
        await AsyncStorage.setItem('apple_health_last_sync', now);
        
        alert('Successfully connected to Apple Health!');
      } else {
        alert(
          'Apple Health Integration Not Available\n\n' +
          'The native module react-native-health is not installed.\n\n' +
          'To enable Apple Health features:\n' +
          '1. Install: npm install react-native-health\n' +
          '2. Prebuild: npx expo prebuild\n' +
          '3. Install pods: cd ios && pod install\n' +
          '4. Configure HealthKit in Xcode\n\n' +
          'See APPLE_HEALTH_SETUP.md for detailed instructions.'
        );
      }
    } catch (error) {
      console.error('Error connecting to Apple Health:', error);
      alert('Error connecting to Apple Health');
    } finally {
      setAppleHealthLoading(false);
    }
  };

  const handleSyncAppleHealth = async () => {
    setAppleHealthLoading(true);
    try {
      const metrics = await AppleHealthService.getLatestMetrics();
      console.log('Synced Apple Health metrics:', metrics);
      
      // Update last sync time
      const now = new Date().toISOString();
      setLastSyncTime(now);
      await AsyncStorage.setItem('apple_health_last_sync', now);
      
      alert('Successfully synced Apple Health data!');
    } catch (error) {
      console.error('Error syncing Apple Health:', error);
      alert('Error syncing Apple Health data');
    } finally {
      setAppleHealthLoading(false);
    }
  };

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

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

        {/* Widget Setup Section - iOS Only */}
        {Platform.OS === 'ios' && (
          <View className="px-6 mb-6">
            <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-3">
              Home Screen Widget
            </Text>
            
            <View style={{ 
              backgroundColor: isDark ? '#000000' : colors.card, 
              borderColor: isDark ? '#2D2D2D' : colors.border 
            }} className="rounded-3xl p-4 border">
              {/* Widget Icon and Title */}
              <View className="flex-row items-center mb-4">
                <View style={{ backgroundColor: isDark ? '#1a1a1a' : '#f3f4f6' }} className="w-12 h-12 rounded-2xl items-center justify-center mr-3">
                  <Ionicons name="grid" size={24} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text style={{ color: colors.text }} className="text-base font-semibold mb-0.5">
                    Migraine Risk Widget
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">
                    View risk on your home screen
                  </Text>
                </View>
              </View>

              {/* Widget Status */}
              {widgetLastUpdate && (
                <View style={{ 
                  backgroundColor: isDark ? '#1a1a1a' : '#f3f4f6',
                  borderColor: isDark ? '#2D2D2D' : 'transparent'
                }} className="rounded-2xl p-3 mb-3 border">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 6 }} />
                    <Text style={{ color: colors.text }} className="text-xs font-medium">
                      Widget Data Active
                    </Text>
                  </View>
                  <Text style={{ color: colors.textSecondary }} className="text-xs mb-3">
                    Last updated: {formatLastSync(widgetLastUpdate)}
                  </Text>
                  
                  {/* Available Widget Sizes */}
                  <View style={{ borderTopWidth: 1, borderTopColor: isDark ? '#2D2D2D' : '#e5e7eb', paddingTop: 12 }}>
                    <Text style={{ color: colors.textSecondary }} className="text-xs mb-2">
                      Available sizes:
                    </Text>
                    <View className="flex-row" style={{ gap: 8 }}>
                      <View style={{ backgroundColor: isDark ? '#000000' : '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                        <Text style={{ color: colors.text }} className="text-xs font-medium">Small</Text>
                      </View>
                      <View style={{ backgroundColor: isDark ? '#000000' : '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                        <Text style={{ color: colors.text }} className="text-xs font-medium">Medium</Text>
                      </View>
                      <View style={{ backgroundColor: isDark ? '#000000' : '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                        <Text style={{ color: colors.text }} className="text-xs font-medium">Large</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Setup Instructions Button */}
              <TouchableOpacity
                onPress={() => setShowWidgetInstructions(!showWidgetInstructions)}
                style={{ 
                  backgroundColor: isDark ? '#1a1a1a' : '#f3f4f6',
                  borderColor: isDark ? '#2D2D2D' : 'transparent'
                }}
                className="rounded-2xl p-3 flex-row items-center justify-between border mb-2"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons 
                    name="information-circle-outline" 
                    size={20} 
                    color={colors.primary} 
                    style={{ marginRight: 10 }} 
                  />
                  <Text style={{ color: colors.text }} className="text-sm font-medium">
                    How to Add Widget
                  </Text>
                </View>
                <Ionicons 
                  name={showWidgetInstructions ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>

              {/* Collapsible Instructions */}
              {showWidgetInstructions && (
                <View style={{ 
                  backgroundColor: isDark ? '#0a0a0a' : '#fafafa',
                  borderColor: isDark ? '#2D2D2D' : '#e5e7eb'
                }} className="rounded-2xl p-4 border mb-2">
                  <Text style={{ color: colors.text }} className="text-sm font-semibold mb-3">
                    Quick Setup:
                  </Text>
                  
                  {/* Step by step */}
                  <View>
                    <View className="flex-row mb-3">
                      <View style={{ backgroundColor: colors.primary }} className="w-6 h-6 rounded-full items-center justify-center mr-3">
                        <Text className="text-white text-xs font-bold">1</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary }} className="text-xs flex-1 leading-5">
                        Long-press any empty space on your home screen
                      </Text>
                    </View>
                    
                    <View className="flex-row mb-3">
                      <View style={{ backgroundColor: colors.primary }} className="w-6 h-6 rounded-full items-center justify-center mr-3">
                        <Text className="text-white text-xs font-bold">2</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary }} className="text-xs flex-1 leading-5">
                        Tap the + button in the top-left corner
                      </Text>
                    </View>
                    
                    <View className="flex-row mb-3">
                      <View style={{ backgroundColor: colors.primary }} className="w-6 h-6 rounded-full items-center justify-center mr-3">
                        <Text className="text-white text-xs font-bold">3</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary }} className="text-xs flex-1 leading-5">
                        Search for "Migraine Risk" in the widget gallery
                      </Text>
                    </View>
                    
                    <View className="flex-row mb-3">
                      <View style={{ backgroundColor: colors.primary }} className="w-6 h-6 rounded-full items-center justify-center mr-3">
                        <Text className="text-white text-xs font-bold">4</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary }} className="text-xs flex-1 leading-5">
                        Choose Small, Medium, or Large size
                      </Text>
                    </View>
                    
                    <View className="flex-row">
                      <View style={{ backgroundColor: colors.primary }} className="w-6 h-6 rounded-full items-center justify-center mr-3">
                        <Text className="text-white text-xs font-bold">5</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary }} className="text-xs flex-1 leading-5">
                        Tap "Add Widget" and position it on your screen
                      </Text>
                    </View>
                  </View>

                  {/* Note */}
                  <View style={{ backgroundColor: isDark ? '#1a1a1a' : '#f3f4f6' }} className="rounded-xl p-3 mt-4">
                    <View className="flex-row">
                      <Ionicons name="information-circle" size={16} color={colors.textSecondary} style={{ marginRight: 8, marginTop: 1 }} />
                      <Text style={{ color: colors.textSecondary }} className="text-xs flex-1">
                        Widget requires a native build. If you don't see it in the gallery, follow the setup guide in WIDGET_SETUP.md
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Refresh Widget Data Button */}
              <TouchableOpacity
                onPress={async () => {
                  await loadWidgetStatus();
                }}
                style={{ backgroundColor: colors.primary }}
                className="rounded-2xl p-4 flex-row items-center justify-center"
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text className="text-white text-sm font-semibold">
                  Refresh Widget Data
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Apple Health Integration */}
        {Platform.OS === 'ios' && (
          <View className="px-6 mb-6">
            <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold uppercase mb-3">
              Apple Health & Watch
            </Text>
            
            <View style={{ 
              backgroundColor: isDark ? '#000000' : colors.card, 
              borderColor: isDark ? '#2D2D2D' : colors.border 
            }} className="rounded-3xl p-4 border">
              <View className="flex-row items-center mb-3">
                <Ionicons name="fitness" size={24} color={appleHealthConnected ? '#22C55E' : colors.textSecondary} />
                <View className="flex-1 ml-3">
                  <Text style={{ color: colors.text }} className="text-sm font-semibold">
                    Apple Health
                  </Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs">
                    {appleHealthConnected ? 'Connected' : 'Not connected'}
                  </Text>
                </View>
                <View className={`w-2 h-2 rounded-full ${appleHealthConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
              </View>

              {appleHealthConnected && (
                <View style={{ 
                  backgroundColor: isDark ? '#1a1a1a' : '#f0f9ff',
                  borderColor: isDark ? '#2D2D2D' : 'transparent'
                }} className="rounded-2xl p-3 mb-3 border">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text style={{ color: colors.textSecondary }} className="text-xs">Last Sync</Text>
                    <Text style={{ color: colors.text }} className="text-xs font-semibold">
                      {formatLastSync(lastSyncTime)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="checkmark-circle" size={12} color="#22C55E" />
                    <Text style={{ color: '#22C55E' }} className="text-xs ml-1">
                      Syncing HR, HRV, Steps, Sleep, Workouts
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                onPress={appleHealthConnected ? handleSyncAppleHealth : handleConnectAppleHealth}
                disabled={appleHealthLoading}
                style={{ 
                  backgroundColor: appleHealthConnected ? (isDark ? '#1a1a1a' : '#f3f4f6') : '#22C55E',
                  opacity: appleHealthLoading ? 0.6 : 1
                }}
                className="rounded-2xl py-3 px-4 flex-row items-center justify-center"
                activeOpacity={0.7}
              >
                {appleHealthLoading ? (
                  <ActivityIndicator size="small" color={appleHealthConnected ? colors.text : '#fff'} />
                ) : (
                  <>
                    <Ionicons 
                      name={appleHealthConnected ? 'sync' : 'add-circle'} 
                      size={18} 
                      color={appleHealthConnected ? colors.text : '#fff'} 
                    />
                    <Text style={{ 
                      color: appleHealthConnected ? colors.text : '#fff',
                      fontSize: 13,
                      fontWeight: '600',
                      marginLeft: 8
                    }}>
                      {appleHealthConnected ? 'Sync Now' : 'Connect Apple Health'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {!appleHealthConnected && (
                <Text style={{ color: colors.textSecondary }} className="text-xs text-center mt-3">
                  Connect to sync Apple Watch health data automatically
                </Text>
              )}
            </View>
          </View>
        )}

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
