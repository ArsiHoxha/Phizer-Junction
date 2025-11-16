import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const BACKEND_URL = 'https://phizer-junction.onrender.com';
const ELEVENLABS_API_KEY = 'sk_a547173ffd906dbb9e9450c126cdae4ed273a6b669966081'; // Your ElevenLabs key
const ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah voice - empathetic, caring tone

export default function MigraineHelpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [conversation, setConversation] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your migraine assistant. Tell me what you\'re experiencing right now, and I\'ll help you through it.',
      timestamp: new Date(),
    }
  ]);

  const colors = {
    background: isDark ? '#000000' : '#FFFFFF',
    card: isDark ? '#1a1a1a' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    border: isDark ? '#2D2D2D' : '#E5E7EB',
    primary: isDark ? '#FFFFFF' : '#000000',
  };

  // Get auth token
  const getToken = async () => {
    return await AsyncStorage.getItem('userToken');
  };

  // Initialize audio on mount
  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  // Start recording
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        alert('Please grant microphone permissions to use voice chat.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please try again.');
    }
  };

  // Stop recording and process
  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);

      console.log('Stopping recording...');
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      console.log('Recording URI:', uri);
      
      if (!uri) {
        throw new Error('No recording URI');
      }

      // Check recording status
      const status = await recording.getStatusAsync();
      console.log('Recording status:', {
        canRecord: status.canRecord,
        isDoneRecording: status.isDoneRecording,
        durationMillis: status.durationMillis,
      });

      // Convert speech to text using backend
      const transcribedText = await transcribeAudio(uri);
      
      // Add user message to conversation
      const userMessage = {
        role: 'user' as const,
        content: transcribedText,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, userMessage]);

      // Get AI response
      await getAIResponse(transcribedText);

      setRecording(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Transcribe audio using ElevenLabs Speech-to-Text
  const transcribeAudio = async (audioUri: string): Promise<string> => {
    try {
      const token = await getToken();
      
      console.log('Audio URI:', audioUri);
      
      // Get file info to check if it exists and has content
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      console.log('File info:', fileInfo);
      
      if (!fileInfo.exists) {
        console.error('Audio file does not exist');
        return 'Could not find the recording. Please try again.';
      }
      
      if (fileInfo.size === 0) {
        console.error('Audio file is empty');
        return 'The recording is empty. Please try speaking again.';
      }
      
      // Create form data with the audio file
      const formData = new FormData();
      
      // For mobile, we need to properly format the file
      const filename = audioUri.split('/').pop() || 'recording.m4a';
      
      // Properly format for React Native
      const file = {
        uri: Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri,
        type: 'audio/m4a',
        name: filename,
      };
      
      formData.append('audio', file as any);

      console.log('Sending audio to backend:', {
        uri: file.uri,
        type: file.type,
        name: file.name,
        size: fileInfo.size,
      });

      const transcriptionResponse = await axios.post(
        `${BACKEND_URL}/api/ai/transcribe-elevenlabs`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('Transcription response:', transcriptionResponse.data);
      return transcriptionResponse.data.text || 'Could not transcribe audio';
    } catch (error: any) {
      console.error('Transcription error:', error?.response?.data || error.message);
      return 'I couldn\'t hear that clearly. Could you try again?';
    }
  };

  // Get AI response and convert to speech
  const getAIResponse = async (userMessage: string) => {
    try {
      const token = await getToken();

      // Get AI response from Gemini
      const response = await axios.post(
        `${BACKEND_URL}/api/ai/migraine-help`,
        {
          message: userMessage,
          conversationHistory: conversation.slice(-5), // Last 5 messages for context
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const aiResponse = response.data.response;

      // Add assistant message to conversation
      const assistantMessage = {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, assistantMessage]);

      // Convert AI response to speech
      await speakText(aiResponse);
    } catch (error) {
      console.error('AI response error:', error);
      const fallbackMessage = 'I\'m here to help. Can you describe your symptoms?';
      
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: fallbackMessage,
        timestamp: new Date(),
      }]);
      
      await speakText(fallbackMessage);
    }
  };

  // Text to speech using ElevenLabs
  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);

      // Stop any currently playing sound
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      // Convert audio buffer to base64
      const base64Audio = btoa(
        new Uint8Array(response.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      // Play audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mpeg;base64,${base64Audio}` },
        { shouldPlay: true }
      );

      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsSpeaking(false);
        }
      });
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
    }
  };

  // Quick action buttons
  const quickActions = [
    { id: 'pain', text: 'I have a headache', icon: 'medical' },
    { id: 'nausea', text: 'I feel nauseous', icon: 'warning' },
    { id: 'light', text: 'Light sensitivity', icon: 'sunny' },
    { id: 'help', text: 'What should I do?', icon: 'help-circle' },
  ];

  const handleQuickAction = async (text: string) => {
    const userMessage = {
      role: 'user' as const,
      content: text,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, userMessage]);
    await getAIResponse(text);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={isDark 
          ? ['#1a1a1a', '#2a2a2a', '#1a1a1a'] 
          : ['#f8f9fa', '#e5e7eb', '#f3f4f6', '#f8f9fa']
        }
        locations={[0, 0.3, 0.7, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
              Migraine Help
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              Voice Assistant
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Conversation */}
        <ScrollView 
          style={{ flex: 1, paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {conversation.map((message, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                marginBottom: 16,
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {message.role === 'assistant' && (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#3B82F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="medical" size={20} color="#FFFFFF" />
                </View>
              )}

              <View
                style={{
                  maxWidth: '75%',
                  backgroundColor: message.role === 'user' 
                    ? (isDark ? '#3B82F6' : '#3B82F6')
                    : (isDark ? '#1a1a1a' : '#FFFFFF'),
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderWidth: message.role === 'assistant' ? 1 : 0,
                  borderColor: colors.border,
                }}
              >
                <Text 
                  style={{ 
                    color: message.role === 'user' ? '#FFFFFF' : colors.text,
                    fontSize: 15,
                    lineHeight: 22,
                  }}
                >
                  {message.content}
                </Text>
                <Text
                  style={{
                    color: message.role === 'user' 
                      ? 'rgba(255, 255, 255, 0.7)' 
                      : colors.textSecondary,
                    fontSize: 11,
                    marginTop: 4,
                  }}
                >
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>

              {message.role === 'user' && (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isDark ? '#2D2D2D' : '#E5E7EB',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 12,
                  }}
                >
                  <Ionicons name="person" size={20} color={colors.text} />
                </View>
              )}
            </View>
          ))}

          {isProcessing && (
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#3B82F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="medical" size={20} color="#FFFFFF" />
              </View>
              <View
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <ActivityIndicator size="small" color="#3B82F6" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                onPress={() => handleQuickAction(action.text)}
                disabled={isRecording || isProcessing || isSpeaking}
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons 
                  name={action.icon as any} 
                  size={16} 
                  color={colors.text} 
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: colors.text, fontSize: 13 }}>
                  {action.text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Voice Button */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isSpeaking}
            style={{
              backgroundColor: isRecording ? '#EF4444' : '#3B82F6',
              height: 70,
              borderRadius: 35,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              shadowColor: isRecording ? '#EF4444' : '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
              opacity: (isProcessing || isSpeaking) ? 0.5 : 1,
            }}
          >
            {isProcessing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 12 }}>
                  Processing...
                </Text>
              </>
            ) : isSpeaking ? (
              <>
                <Ionicons name="volume-high" size={24} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 12 }}>
                  Speaking...
                </Text>
              </>
            ) : isRecording ? (
              <>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#FFFFFF',
                    marginRight: 12,
                  }}
                />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
                  Tap to Stop Recording
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="mic" size={28} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 12 }}>
                  Tap to Speak
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={{ 
            color: colors.textSecondary, 
            fontSize: 12, 
            textAlign: 'center',
            marginTop: 12,
          }}>
            {isRecording 
              ? 'Listening... Tell me about your symptoms' 
              : 'Press and hold to describe your migraine'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
