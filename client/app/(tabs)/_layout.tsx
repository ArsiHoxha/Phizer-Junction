import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { migraineAPI, setAuthToken } from '../../services/api';

export default function TabLayout() {
  const { isDark, colors } = useTheme();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [logging, setLogging] = useState(false);

  const handleQuickLog = async () => {
    if (logging || !user?.id) return;

    setLogging(true);
    try {
      const token = await getToken();
      setAuthToken(token);

      const response = await migraineAPI.quickLogMigraine();

      if (response.success) {
        Alert.alert(
          '✅ Migraine Logged',
          'AI is analyzing your metrics to learn patterns and prevent future migraines.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error logging migraine:', error);
      Alert.alert('Error', 'Failed to log migraine. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#000000' : colors.surface,
          borderTopWidth: 1,
          borderTopColor: isDark ? '#2D2D2D' : colors.border,
          paddingBottom: 20,
          paddingTop: 12,
          height: 85,
        },
        tabBarActiveTintColor: isDark ? '#FFFFFF' : colors.primary,
        tabBarInactiveTintColor: isDark ? '#6B7280' : colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analysis',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={24} color={color} />
          ),
        }}
      />
      
      {/* Custom Floating Migraine Log Button */}
      <Tabs.Screen
        name="log-migraine"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.floatingButtonContainer}>
              <TouchableOpacity
                onPress={handleQuickLog}
                disabled={logging}
                style={[styles.floatingButton, {
                  shadowColor: '#EF4444',
                  opacity: logging ? 0.6 : 1,
                }]}
                activeOpacity={0.8}
              >
                <View style={styles.iconContainer}>
                  {logging ? (
                    <Ionicons name="hourglass" size={32} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="medical" size={32} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent navigation
            e.preventDefault();
            // Handled by onPress above
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: 'absolute',
    top: -30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: '#EF4444', // Red for migraine
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
