const { ElevenLabsClient } = require('elevenlabs');

// Initialize ElevenLabs client
// Get your API key from: https://elevenlabs.io/app/settings/api-keys
const elevenlabs = new ElevenLabsClient({
  apiKey: 'sk_349f2a2b6f868b5e9bee141861ea330121d93d9bbe324720'
});

async function textToSpeech(text) {
  try {
    // Generate audio from text using ElevenLabs
    const audio = await elevenlabs.generate({
      voice: "Rachel", // Calm, professional female voice - great for health advice
      // Other voice options: "Domi" (confident), "Bella" (soft), "Antoni" (deep male), 
      // "Elli" (emotional), "Josh" (young male), "Arnold" (mature male), "Adam" (deep), "Sam" (dynamic)
      text: text,
      model_id: "eleven_multilingual_v2" // Supports multiple languages
    });

    // Convert audio stream to buffer
    const chunks = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('ElevenLabs Error:', error);
    throw error;
  }
}

module.exports = {
  textToSpeech
};
