const { ElevenLabsClient } = require('elevenlabs');
require('dotenv').config();

// Initialize ElevenLabs client with environment variable
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const elevenlabs = ELEVENLABS_API_KEY ? new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY
}) : null;

// Fallback voices (free tier friendly)
const FALLBACK_VOICES = {
  'Rachel': '21m00Tcm4TlvDq8ikWAM', // Calm female
  'Adam': 'pNInz6obpgDQGcFmaJgB',   // Deep male
  'Bella': 'EXAVITQu4vr4xnSDxMaL',  // Soft female
  'Josh': 'TxGEqnHWrfWFTfGW9XjX',   // Young male
};

async function textToSpeech(text, voiceName = 'Rachel') {
  try {
    // Check if API key is configured
    if (!elevenlabs || !ELEVENLABS_API_KEY) {
      console.warn('⚠️ ElevenLabs API key not configured. Audio generation disabled.');
      return null;
    }

    // Use voice ID instead of name to avoid permission issues
    const voiceId = FALLBACK_VOICES[voiceName] || FALLBACK_VOICES['Rachel'];

    // Generate audio from text using ElevenLabs
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
      text: text,
      model_id: "eleven_turbo_v2", // Faster, cheaper model for free tier
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    });

    // Convert audio stream to buffer
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('⚠️ ElevenLabs Error:', error.message);
    
    // Handle permission errors gracefully
    if (error.statusCode === 401 || error.message?.includes('missing_permissions')) {
      console.warn('⚠️ ElevenLabs API key has insufficient permissions. Audio generation disabled.');
      console.warn('💡 To fix: Visit https://elevenlabs.io/app/settings/api-keys and regenerate with all permissions.');
      return null;
    }
    
    // For other errors, return null instead of throwing
    console.error('⚠️ Audio generation failed. Continuing without audio.');
    return null;
  }
}

module.exports = {
  textToSpeech
};
