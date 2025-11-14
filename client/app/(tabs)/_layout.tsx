import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 68,
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <View className={`w-6 h-6 rounded-full ${focused ? 'bg-black' : 'bg-gray-400'}`} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <View className={`w-6 h-6 rounded-full ${focused ? 'bg-black' : 'bg-gray-400'}`} />
          ),
        }}
      />
    </Tabs>
  );
}
