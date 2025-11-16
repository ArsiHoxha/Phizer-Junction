import { Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Modal, Text, ScrollView, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { migraineAPI, setAuthToken } from '../../services/api';
import axios from 'axios';
import { BACKEND_URL } from '../../config/config';

export default function TabLayout() {
  const { isDark, colors } = useTheme();
  const { user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [logging, setLogging] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const handleQuickLog = async () => {
    if (logging || !user?.id) return;

    setLogging(true);
    try {
      const token = await getToken();
      setAuthToken(token);

      // Log the migraine
      const response = await migraineAPI.quickLogMigraine();

      if (response.success) {
        // Show loading modal immediately
        setShowAnalysisModal(true);
        setLoadingAnalysis(true);
        
        // Get AI analysis of what caused this migraine
        try {
          const analysisResponse = await axios.get(
            `${BACKEND_URL}/api/migraine/${response.migraineLog._id}/analysis`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          setAnalysisData(analysisResponse.data);
        } catch (analysisError) {
          console.error('Analysis error:', analysisError);
          setAnalysisData({
            success: false,
            message: 'Migraine logged but analysis failed. We\'re still learning from your data!'
          });
        } finally {
          setLoadingAnalysis(false);
        }
      }
    } catch (error) {
      console.error('Error logging migraine:', error);
      Alert.alert('Error', 'Failed to log migraine. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <>
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
      
      {/* Voice Assistant Button - Hidden */}
      <Tabs.Screen
        name="migraine-help"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      
      {/* Explore - Hidden (not implemented) */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tab bar
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
      
      {/* Hidden - not displayed in tab bar */}
      <Tabs.Screen
        name="log-migraine"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      
      {/* Chat - Hidden */}
      <Tabs.Screen
        name="chat"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
    
    {/* Migraine Analysis Modal */}
    <Modal
      visible={showAnalysisModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAnalysisModal(false)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ 
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '80%',
          paddingTop: 24,
          paddingHorizontal: 24,
          paddingBottom: 40,
        }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                backgroundColor: '#EF4444', 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                justifyContent: 'center', 
                alignItems: 'center',
                marginRight: 12 
              }}>
                <Ionicons name="medical" size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={{ 
                  color: colors.text, 
                  fontSize: 20, 
                  fontWeight: 'bold' 
                }}>
                  Migraine Logged
                </Text>
                <Text style={{ 
                  color: colors.textSecondary, 
                  fontSize: 12 
                }}>
                  AI Analysis Complete
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowAnalysisModal(false)}>
              <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loadingAnalysis ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: colors.text, marginTop: 16, fontSize: 16 }}>
                Analyzing what caused your migraine...
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 12, textAlign: 'center' }}>
                Comparing your current metrics to past migraines
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight: '100%' }}>
              {analysisData?.success ? (
                <View>
                  {/* Primary Causes */}
                  {analysisData.analysis?.primaryCauses && analysisData.analysis.primaryCauses.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{ 
                        color: colors.text, 
                        fontSize: 16, 
                        fontWeight: '600', 
                        marginBottom: 12 
                      }}>
                        🎯 What Likely Caused This Migraine
                      </Text>
                      {analysisData.analysis.primaryCauses.map((cause: any, index: number) => (
                        <View key={index} style={{ 
                          backgroundColor: isDark ? '#1A1A1A' : '#FEF2F2',
                          padding: 14,
                          borderRadius: 12,
                          marginBottom: 10,
                          borderLeftWidth: 4,
                          borderLeftColor: '#EF4444'
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ 
                              color: '#EF4444', 
                              fontSize: 15, 
                              fontWeight: '700' 
                            }}>
                              {cause.factor || cause}
                            </Text>
                            {cause.contribution && (
                              <View style={{ 
                                backgroundColor: '#EF4444', 
                                paddingHorizontal: 8, 
                                paddingVertical: 2, 
                                borderRadius: 8,
                                marginLeft: 'auto'
                              }}>
                                <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>
                                  {cause.contribution}% impact
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
                            {cause.explanation || cause}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Current Metrics at Time of Migraine */}
                  {analysisData.migraineLog?.metricsSnapshot && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{ 
                        color: colors.text, 
                        fontSize: 16, 
                        fontWeight: '600', 
                        marginBottom: 12 
                      }}>
                        📊 Your Numbers When Migraine Hit
                      </Text>
                      <View style={{ 
                        backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6',
                        padding: 16,
                        borderRadius: 12
                      }}>
                        {analysisData.migraineLog.metricsSnapshot.hrv && (
                          <Text style={{ color: colors.text, fontSize: 14, marginBottom: 8 }}>
                            • HRV: <Text style={{ fontWeight: 'bold' }}>{Math.round(analysisData.migraineLog.metricsSnapshot.hrv)}ms</Text>
                            {analysisData.migraineLog.metricsSnapshot.hrv < 45 && 
                              <Text style={{ color: '#EF4444' }}> (Low - High stress!)</Text>
                            }
                          </Text>
                        )}
                        {analysisData.migraineLog.metricsSnapshot.stress !== undefined && (
                          <Text style={{ color: colors.text, fontSize: 14, marginBottom: 8 }}>
                            • Stress: <Text style={{ fontWeight: 'bold' }}>{Math.round(analysisData.migraineLog.metricsSnapshot.stress)}%</Text>
                            {analysisData.migraineLog.metricsSnapshot.stress > 60 && 
                              <Text style={{ color: '#EF4444' }}> (High!)</Text>
                            }
                          </Text>
                        )}
                        {analysisData.migraineLog.metricsSnapshot.sleepQuality !== undefined && (
                          <Text style={{ color: colors.text, fontSize: 14, marginBottom: 8 }}>
                            • Sleep Quality: <Text style={{ fontWeight: 'bold' }}>{Math.round(analysisData.migraineLog.metricsSnapshot.sleepQuality)}%</Text>
                            {analysisData.migraineLog.metricsSnapshot.sleepQuality < 60 && 
                              <Text style={{ color: '#EF4444' }}> (Poor!)</Text>
                            }
                          </Text>
                        )}
                        {analysisData.migraineLog.metricsSnapshot.weather?.pressure && (
                          <Text style={{ color: colors.text, fontSize: 14, marginBottom: 8 }}>
                            • Pressure: <Text style={{ fontWeight: 'bold' }}>{Math.round(analysisData.migraineLog.metricsSnapshot.weather.pressure)} hPa</Text>
                            {analysisData.migraineLog.metricsSnapshot.weather.pressure < 1010 && 
                              <Text style={{ color: '#EF4444' }}> (Low - Trigger!)</Text>
                            }
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Recommendations */}
                  {analysisData.analysis?.recommendations && analysisData.analysis.recommendations.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{ 
                        color: colors.text, 
                        fontSize: 16, 
                        fontWeight: '600', 
                        marginBottom: 12 
                      }}>
                        💡 What To Do Next
                      </Text>
                      {analysisData.analysis.recommendations.map((rec: string, index: number) => (
                        <View key={index} style={{ 
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          marginBottom: 10
                        }}>
                          <Text style={{ color: colors.primary, fontSize: 20, marginRight: 8 }}>•</Text>
                          <Text style={{ color: colors.text, fontSize: 14, flex: 1, lineHeight: 20 }}>
                            {rec}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* AI Learning Note */}
                  {analysisData.analysis?.similarPatterns && analysisData.analysis.similarPatterns.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{ 
                        color: colors.text, 
                        fontSize: 16, 
                        fontWeight: '600', 
                        marginBottom: 12 
                      }}>
                        🔄 Pattern Recognition
                      </Text>
                      <View style={{ 
                        backgroundColor: isDark ? '#1A1A1A' : '#F0F9FF',
                        padding: 14,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.primary
                      }}>
                        <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20, marginBottom: 8 }}>
                          This migraine is <Text style={{ fontWeight: 'bold', color: colors.primary }}>
                          {analysisData.analysis.similarPatterns[0].similarity}% similar
                          </Text> to your migraine on{' '}
                          {new Date(analysisData.analysis.similarPatterns[0].date).toLocaleDateString()}.
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                          The AI is now actively monitoring for this pattern and sending you automatic alerts when similar conditions are detected!
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* AI Learning Note */}
                  <View style={{ 
                    backgroundColor: isDark ? '#0F172A' : '#EFF6FF',
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.primary
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons name="sparkles" size={20} color={colors.primary} />
                      <Text style={{ 
                        color: colors.primary, 
                        fontSize: 14, 
                        fontWeight: '600',
                        marginLeft: 8
                      }}>
                        AI Learning in Progress
                      </Text>
                    </View>
                    <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>
                      {analysisData.analysis?.confidence 
                        ? `I'm ${Math.round(analysisData.analysis.confidence)}% confident in this analysis. The more migraines you log, the better I become at predicting and preventing them!`
                        : `I've saved this migraine data and I'm learning from it. I'm now actively monitoring these patterns and will automatically send you alerts when similar conditions are detected!`
                      }
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>
                    Migraine Logged Successfully
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                    AI is learning from your data to predict and prevent future migraines.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* Close Button */}
          {!loadingAnalysis && (
            <TouchableOpacity
              onPress={() => setShowAnalysisModal(false)}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                marginTop: 20
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                Got It
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
    </>
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
