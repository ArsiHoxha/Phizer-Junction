import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { migraineAPI, setAuthToken } from '../../services/api';

export default function LogMigraineScreen() {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    // Pulse animation for the button
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleQuickLog = async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      setAuthToken(token);

      // One-click migraine log - AI captures everything automatically
      const response = await migraineAPI.quickLogMigraine();

      if (response.success) {
        setAnalysisComplete(true);
        
        // Show success for 2 seconds then go back
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2500);
      }
    } catch (error) {
      console.error('Error logging migraine:', error);
      setLoading(false);
    }
  };

  if (analysisComplete) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} className="items-center justify-center">
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={{ backgroundColor: '#10B981' }} className="w-24 h-24 rounded-full items-center justify-center mb-6">
            <Ionicons name="checkmark" size={60} color="#FFFFFF" />
          </View>
        </Animated.View>
        
        <Text style={{ color: colors.text }} className="text-2xl font-bold mb-2">
          Migraine Logged
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-base text-center px-8">
          AI is analyzing your metrics to prevent future migraines
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
        backgroundColor: isDark ? '#1a1a1a' : colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#2D2D2D' : colors.border,
      }}>
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text }} className="text-xl font-bold">
            Quick Log
          </Text>
          <View style={{ width: 28 }} />
        </View>
        <Text style={{ color: colors.textSecondary }} className="text-sm mt-2">
          One tap to log and analyze
        </Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 items-center justify-center px-8">
        {loading ? (
          <>
            <ActivityIndicator size="large" color="#EF4444" />
            <Text style={{ color: colors.text }} className="text-lg font-semibold mt-6">
              Capturing Metrics...
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm text-center mt-2">
              Recording HRV, stress, sleep, screen time, weather and more
            </Text>
          </>
        ) : (
          <>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                onPress={handleQuickLog}
                style={{
                  backgroundColor: '#EF4444',
                  shadowColor: '#EF4444',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 12,
                }}
                className="w-48 h-48 rounded-full items-center justify-center"
                activeOpacity={0.8}
              >
                <Ionicons name="medical" size={80} color="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>

            <Text style={{ color: colors.text }} className="text-2xl font-bold mt-8 mb-3 text-center">
              I Have a Migraine
            </Text>
            
            <Text style={{ color: colors.textSecondary }} className="text-base text-center mb-6">
              Tap the button to log your migraine
            </Text>

            {/* Info Cards */}
            <View className="w-full space-y-3">
              <View
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#EFF6FF',
                  borderLeftWidth: 4,
                  borderLeftColor: '#3B82F6',
                }}
                className="p-4 rounded-xl"
              >
                <View className="flex-row items-start">
                  <Ionicons name="analytics" size={24} color="#3B82F6" />
                  <View className="flex-1 ml-3">
                    <Text style={{ color: isDark ? colors.text : '#1E40AF' }} className="text-sm font-semibold mb-1">
                      AI Auto-Analysis
                    </Text>
                    <Text style={{ color: isDark ? colors.textSecondary : '#3B82F6' }} className="text-xs">
                      Automatically captures all current metrics and identifies triggers
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#F0FDF4',
                  borderLeftWidth: 4,
                  borderLeftColor: '#10B981',
                }}
                className="p-4 rounded-xl"
              >
                <View className="flex-row items-start">
                  <Ionicons name="notifications" size={24} color="#10B981" />
                  <View className="flex-1 ml-3">
                    <Text style={{ color: isDark ? colors.text : '#065F46' }} className="text-sm font-semibold mb-1">
                      Smart Predictions
                    </Text>
                    <Text style={{ color: isDark ? colors.textSecondary : '#059669' }} className="text-xs">
                      Learn patterns and warn you before similar conditions occur
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#FEF3C7',
                  borderLeftWidth: 4,
                  borderLeftColor: '#F59E0B',
                }}
                className="p-4 rounded-xl"
              >
                <View className="flex-row items-start">
                  <Ionicons name="shield-checkmark" size={24} color="#F59E0B" />
                  <View className="flex-1 ml-3">
                    <Text style={{ color: isDark ? colors.text : '#92400E' }} className="text-sm font-semibold mb-1">
                      Prevention Insights
                    </Text>
                    <Text style={{ color: isDark ? colors.textSecondary : '#D97706' }} className="text-xs">
                      Get personalized recommendations to prevent future migraines
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
