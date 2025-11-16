# 🎤 Migraine Help Voice Assistant Feature

## Overview
This feature provides real-time voice-based assistance for users experiencing migraines. It uses **Speech-to-Text** (Whisper AI) and **Text-to-Speech** (ElevenLabs) to create a conversational experience where users can describe their symptoms and receive immediate AI-powered guidance.

---

## 🎯 User Flow

### 1. **Accessing the Feature**
- From the main dashboard, users can tap the **"Need Help"** button (red button with medical icon)
- This opens the Migraine Help screen

### 2. **Voice Interaction**
1. **User taps the microphone button** → Recording starts
2. **User describes symptoms** → "I have a severe headache on my left side with nausea"
3. **User taps to stop** → Audio is transcribed using OpenAI Whisper
4. **AI processes the message** → Gemini AI analyzes symptoms with user's health context
5. **AI responds via voice** → ElevenLabs converts response to natural speech
6. **Conversation continues** → Users can ask follow-up questions

### 3. **Quick Actions**
Users can also tap quick-action buttons for common scenarios:
- "I have a headache"
- "I feel nauseous"
- "Light sensitivity"
- "What should I do?"

---

## 🏗️ Technical Architecture

### **Frontend** (`client/app/migraine-help.tsx`)

#### Components:
- **Voice Recording**: Uses `expo-av` to record user's voice
- **Conversation Display**: Chat-style interface showing user and AI messages
- **Quick Actions**: Preset buttons for common queries
- **Visual Feedback**: Shows recording, processing, and speaking states

#### Key Functions:

```typescript
startRecording()    // Captures user voice input
stopRecording()     // Stops recording and sends to backend
transcribeAudio()   // Converts speech to text via backend
getAIResponse()     // Gets intelligent response from Gemini AI
speakText()         // Converts AI response to speech via ElevenLabs
```

#### States:
- `isRecording` - Voice is being captured
- `isProcessing` - Audio is being transcribed and analyzed
- `isSpeaking` - AI response is being spoken
- `conversation` - Array of all messages exchanged

---

### **Backend** (`backend/server.js`)

#### New API Endpoints:

##### 1. **POST `/api/ai/transcribe-elevenlabs`**
Converts recorded audio to text using ElevenLabs Speech-to-Text

**Input:**
- `audio` (file): Audio recording (m4a/wav/mp3)

**Output:**
```json
{
  "text": "I have a severe headache with light sensitivity"
}
```

**How it works:**
1. Receives audio file via multipart/form-data
2. Forwards to ElevenLabs Speech-to-Text API
3. Uses `eleven_multilingual_v2` model for high accuracy
4. Returns transcribed text

**Why ElevenLabs instead of Whisper?**
- ✅ Same provider for both speech-to-text AND text-to-speech
- ✅ No need for OpenAI account
- ✅ Better integration with voice responses
- ✅ More generous free tier

---

##### 2. **POST `/api/ai/migraine-help`**
Provides AI-powered migraine assistance

**Input:**
```json
{
  "message": "I have a severe headache",
  "conversationHistory": [
    { "role": "user", "content": "Previous message..." },
    { "role": "assistant", "content": "Previous response..." }
  ]
}
```

**Output:**
```json
{
  "response": "I understand you're in pain. Try resting in a dark, quiet room. If you have prescribed medication, now is a good time to take it. Stay hydrated with small sips of water."
}
```

**Context Provided to AI:**
- User's current health metrics (HRV, stress, sleep, screen time) with interpretation
- Recent migraine history (last 3 migraines with triggers)
- Conversation history (last 4 messages for context)

**AI Prompt Structure:**
```
You are a compassionate migraine care assistant...

User's Current Health Data:
- HRV: 45ms (LOW - nervous system stressed)
- Stress: 75% (HIGH)
- Sleep: 5.2 hours (Poor - sleep deprivation)
- Recent migraines: 3 in past week, common triggers: stress, poor sleep

Conversation:
User: I have a severe headache
Assistant: [2-3 sentence empathetic, practical response]
```

**Gemini 2.0 Flash Configuration:**
- Temperature: 0.9 (More creative, empathetic responses)
- TopP: 0.95 (Diverse vocabulary)
- Max tokens: 150 (Keep responses concise)

---

## 🎙️ Integration Details

### **1. ElevenLabs Speech-to-Text**
- **API**: `https://api.elevenlabs.io/v1/speech-to-text`
- **Model**: `eleven_multilingual_v2`
- **Accuracy**: ~95% for clear speech in multiple languages
- **Cost**: Free tier includes 10,000 characters/month
- **Benefits**: Single provider for both speech-to-text AND text-to-speech

**Setup:**
```bash
# Already configured in backend/.env ✅
ELEVENLABS_API_KEY=sk_46e01cad85b2f7f1e2c8570535befc8e23be2411dc5c11e0
```

---

### **2. ElevenLabs Text-to-Speech**
- **API**: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- **Voice**: Sarah (empathetic, caring tone)
- **Voice ID**: `EXAVITQu4vr4xnSDxMaL`
- **Cost**: Same free tier as speech-to-text
- **Quality**: Natural, human-like speech with emotion

**Already configured in both:**
- ✅ Backend: `.env` file
- ✅ Frontend: `migraine-help.tsx`

---

### **3. Google Gemini 2.0 Flash Exp (Conversational AI)**
- **Model**: `gemini-2.0-flash-exp` (Latest experimental model)
- **Purpose**: Generates empathetic, contextual responses
- **Config**: Temperature 0.9, TopP 0.95, Max 150 tokens
- **Cost**: Free tier available
- **Already configured** ✅

**Why Gemini 2.0 Flash?**
- ⚡ Faster responses than GPT-4
- 💰 More cost-effective
- 🎯 Excellent at empathetic healthcare conversations
- 🔄 Better context retention
- 🆓 Generous free tier

---

## 📱 User Experience Features

### **Visual Indicators:**
- 🔴 **Recording**: Red pulsing button with "Listening..." text
- ⚙️ **Processing**: Loading spinner with "Processing..." text
- 🔊 **Speaking**: Volume icon with "Speaking..." text
- ✅ **Ready**: Blue microphone button with "Tap to Speak"

### **Conversation Bubbles:**
- **User messages**: Blue bubbles on the right with person icon
- **AI messages**: White/dark bubbles on the left with medical icon
- **Timestamps**: Shows time of each message

### **Quick Actions:**
- 💊 Medical - "I have a headache"
- ⚠️ Warning - "I feel nauseous"
- ☀️ Sunny - "Light sensitivity"
- ❓ Help - "What should I do?"

---

## 🔒 Security & Privacy

### **Authentication:**
- All API calls require valid Clerk JWT token
- User-specific context is fetched securely

### **Data Handling:**
- Audio files are **not stored** on server
- Transcriptions are processed in real-time
- Conversation history is client-side only

### **Privacy Considerations:**
- Audio processing happens via secure HTTPS
- No conversation data is saved to database
- User health metrics used only for context

---

## 🚀 Setup Instructions

### **1. Backend Setup**

```bash
cd backend

# Install dependencies
npm install multer form-data

# Verify .env has ElevenLabs key (already configured ✅)
cat .env | grep ELEVENLABS
# Should show: ELEVENLABS_API_KEY=sk_46e01cad85b2f7f1e2c8570535befc8e23be2411dc5c11e0

# Restart server
npm start
```

### **2. Frontend Setup**

```bash
cd client

# The ElevenLabs API key is already configured in migraine-help.tsx ✅
# No additional packages needed (expo-av already installed)
```

### **3. API Key Verification**

#### **ElevenLabs (Speech-to-Text + Text-to-Speech):**
✅ Already configured in:
- Backend: `.env` file
- Frontend: `migraine-help.tsx`

If you need a new key:
1. Go to https://elevenlabs.io/
2. Sign up (free tier: 10,000 characters/month)
3. Profile → API Key → Copy
4. Update both backend `.env` and frontend file

#### **Gemini AI:**
✅ Already configured in backend `.env`

---

## 💡 Usage Examples

### **Example Conversation:**

**User:** 🎤 "I'm getting a migraine. Left side of my head is throbbing."

**AI:** 🔊 "I'm sorry you're experiencing pain. Based on your recent stress levels being high at 75%, this might be stress-related. Try these steps:

1. Move to a dark, quiet room
2. Apply a cold compress to the painful area
3. Take your prescribed medication if available
4. Practice slow, deep breathing

Your HRV is also low at 45ms, so relaxation is key. Would you like more specific relief techniques?"

**User:** 🎤 "Yes, what breathing exercises can help?"

**AI:** 🔊 "Try the 4-7-8 technique:
1. Breathe in for 4 seconds
2. Hold for 7 seconds
3. Exhale for 8 seconds
4. Repeat 4 times

This activates your parasympathetic nervous system and can reduce migraine intensity. How are you feeling now?"

---

## 📊 Benefits

### **For Users:**
- ✅ Hands-free assistance during migraine episodes
- ✅ Immediate, contextual guidance
- ✅ Reduces anxiety through empathetic AI
- ✅ No need to type when in pain
- ✅ Natural conversation flow

### **For App:**
- ✅ Differentiating feature from competitors
- ✅ Increases user engagement
- ✅ Provides value during critical moments
- ✅ Builds trust through supportive AI
- ✅ Collects usage patterns (anonymously)

---

## 🎨 UI Components

### **Main Screen Layout:**
```
┌─────────────────────────────────┐
│  ← Migraine Help                │  Header
│     Voice Assistant              │
├─────────────────────────────────┤
│                                  │
│  💊 Hello! I'm your migraine    │  AI Message
│     assistant...                 │
│     10:30 AM                     │
│                                  │
│                     I have a  👤 │  User Message
│                     headache.    │
│                     10:31 AM     │
│                                  │
│  💊 I understand...              │  AI Response
│     [empathetic response]        │
│     10:31 AM                     │
│                                  │
├─────────────────────────────────┤
│ [💊] I have   [⚠️] I feel        │  Quick Actions
│  a headache      nauseous        │
├─────────────────────────────────┤
│                                  │
│    🎤 Tap to Speak               │  Voice Button
│                                  │
│  Press and hold to describe...   │
└─────────────────────────────────┘
```

---

## 🐛 Error Handling

### **Microphone Permission Denied:**
```typescript
// Shows alert asking user to enable mic in settings
alert('Please grant microphone permissions...');
```

### **Transcription Fails:**
```typescript
// Returns fallback message
return 'I couldn\'t hear that clearly. Could you try again?';
```

### **AI API Error:**
```typescript
// Provides supportive fallback response
'I understand you\'re going through a difficult time. 
Try resting in a dark, quiet room and staying hydrated.'
```

### **Network Issues:**
```typescript
// Queues message for retry
// Shows offline indicator
```

---

## 📈 Future Enhancements

### **Phase 2:**
- [ ] Save conversation history to database
- [ ] Emergency contact integration ("Call my doctor")
- [ ] Medication reminder integration
- [ ] Multi-language support
- [ ] Offline mode with pre-recorded responses

### **Phase 3:**
- [ ] Video call with healthcare provider
- [ ] Share conversation with doctor
- [ ] Voice-activated migraine logging
- [ ] Ambient sound therapy integration
- [ ] Real-time symptom tracking during conversation

---

## 📝 Testing Checklist

- [ ] Record voice → transcription accurate
- [ ] AI response is empathetic and relevant
- [ ] TTS plays correctly
- [ ] Quick actions work
- [ ] Conversation history displays
- [ ] Works in dark mode
- [ ] Handles interruptions (phone call, app background)
- [ ] Permissions handled gracefully
- [ ] Error states show helpful messages

---

## 🆘 Troubleshooting

### **Audio Not Recording:**
1. Check microphone permissions in device settings
2. Verify `expo-av` is installed
3. Check Audio.setAudioModeAsync configuration

### **Transcription Returns Empty:**
1. Verify ELEVENLABS_API_KEY in both backend .env and frontend
2. Check audio file format (should be m4a/wav/mp3)
3. Test with longer recordings (3+ seconds)
4. Ensure clear speech without background noise

### **AI Response Slow:**
1. Check backend logs for Gemini API errors
2. Verify GEMINI_API_KEY is valid
3. Gemini 2.0 Flash should respond in 1-2 seconds
4. Consider reducing maxOutputTokens if needed

### **TTS Not Playing:**
1. Verify ELEVENLABS_API_KEY in frontend code (line 9)
2. Check base64 audio conversion
3. Test with simple text first
4. Ensure device volume is up and not muted

---

## 📚 Resources

- **Expo Audio Docs**: https://docs.expo.dev/versions/latest/sdk/audio/
- **ElevenLabs Speech-to-Text**: https://elevenlabs.io/docs/api-reference/speech-to-text
- **ElevenLabs Text-to-Speech**: https://elevenlabs.io/docs/api-reference/text-to-speech
- **Gemini 2.0 Flash**: https://ai.google.dev/gemini-api/docs/models/gemini-v2

---

**Created by**: Phizer Junction Team  
**Last Updated**: November 15, 2025  
**Version**: 1.0.0
