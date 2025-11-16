import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { Audio } from 'expo-av';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-expo';

const BACKEND_URL = 'https://phizer-junction.onrender.com';
const ELEVENLABS_API_KEY = 'sk_46e01cad85b2f7f1e2c8570535befc8e23be2411dc5c11e0';
const ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah voice

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatScreen() {
  const { isDark, colors } = useTheme();
  const { getToken } = useAuth();
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access microphone is required!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (!uri) {
        throw new Error('No recording URI');
      }

      const transcribedText = await transcribeAudio(uri);
      
      const userMessage: Message = {
        role: 'user',
        content: transcribedText,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, userMessage]);

      await getAIResponse(transcribedText);
      
      setRecording(null);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsProcessing(false);
    }
  };

  const transcribeAudio = async (audioUri: string): Promise<string> => {
    try {
      const token = await getToken();
      
      const response = await fetch(audioUri);
      const audioBlob = await response.blob();
      
      const formData = new FormData();
      formData.append('audio', audioBlob as any, 'recording.m4a');
      
      const transcriptionResponse = await axios.post(
        `${BACKEND_URL}/api/ai/transcribe-elevenlabs`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return transcriptionResponse.data.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  };

  const getAIResponse = async (userMessage: string) => {
    try {
      const token = await getToken();
      
      const response = await axios.post(
        `${BACKEND_URL}/api/ai/chat`,
        {
          message: userMessage,
          conversationHistory: conversation.slice(-5),
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      const aiResponse = response.data.response;
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, assistantMessage]);
      
      await speakText(aiResponse);
      
      setIsProcessing(false);
    } catch (error) {
      console.error('AI response error:', error);
      setIsProcessing(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeaking(true);
      
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
      
      const base64Audio = btoa(
        new Uint8Array(response.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );
      
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
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark 
          ? ['#1a1a1a', '#2a2a2a', '#1a1a1a'] 
          : ['#f8f9fa', '#e5e7eb', '#f3f4f6', '#f8f9fa']
        }
        locations={[0, 0.3, 0.7, 1]}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View style={{ alignItems: 'center' }}>
            {/* Animated Microphone Button */}
            <View style={{ position: 'relative', marginBottom: 48 }}>
              {/* Pulse rings when active */}
              {(isRecording || isSpeaking) && (
                <>
                  <View
                    style={{
                      position: 'absolute',
                      width: 200,
                      height: 200,
                      borderRadius: 100,
                      backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      top: -40,
                      left: -40,
                    }}
                    className="animate-pulse"
                  />
                  <View
                    style={{
                      position: 'absolute',
                      width: 160,
                      height: 160,
                      borderRadius: 80,
                      backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      top: -20,
                      left: -20,
                    }}
                    className="animate-pulse"
                  />
                </>
              )}
              
              {/* Main button */}
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                disabled={isProcessing || isSpeaking}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: isRecording ? '#EF4444' : '#3B82F6',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: isRecording ? '#EF4444' : '#3B82F6',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 12,
                  opacity: (isProcessing || isSpeaking) ? 0.6 : 1,
                }}
              >
                <Ionicons 
                  name={isRecording ? 'stop' : 'mic'} 
                  size={56} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            </View>

            {/* Status Text */}
            <Text 
              style={{ 
                color: colors.text,
                fontSize: 24,
                fontWeight: 'bold',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {isRecording 
                ? '🎙️ Listening...' 
                : isSpeaking 
                ? '🔊 Speaking...' 
                : isProcessing 
                ? '🤔 Thinking...'
                : '💬 Voice Assistant'}
            </Text>
            
            <Text 
              style={{ 
                color: colors.textSecondary,
                fontSize: 16,
                textAlign: 'center',
                paddingHorizontal: 24,
              }}
            >
              {isRecording 
                ? 'Tap to stop recording' 
                : isSpeaking 
                ? 'AI is responding...' 
                : isProcessing 
                ? 'Processing your message...'
                : 'Tap the microphone to speak'}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View 
          style={{ 
            paddingHorizontal: 24,
            paddingBottom: 32,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
            Powered by ElevenLabs & Gemini 2.0 Flash
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
