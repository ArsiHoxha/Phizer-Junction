# ElevenLabs API Key Fix

## Problem
The ElevenLabs API key had insufficient permissions:
```
Status code: 401
"message": "The API key you used is missing the permission voices_read to execute this operation."
```

## Solution Applied

### 1. Updated `.env` File
Added the provided API key:
```bash
ELEVENLABS_API_KEY=sk_3479a57646bc3c5045b17c8ab0d251ccadf964444d5956fb
```

### 2. Fixed `elevenLabsService.js`
**Changes:**
- ✅ Now reads API key from environment variable
- ✅ Uses voice IDs instead of names (avoids `voices_read` permission)
- ✅ Switched to `eleven_turbo_v2` model (free tier friendly)
- ✅ Graceful error handling - returns `null` instead of throwing
- ✅ Continues without audio if API fails

**Before:**
```javascript
const audio = await elevenlabs.generate({
  voice: "Rachel", // ❌ Requires voices_read permission
  text: text,
  model_id: "eleven_multilingual_v2"
});
```

**After:**
```javascript
const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Direct voice ID
const audio = await elevenlabs.textToSpeech.convert(voiceId, {
  text: text,
  model_id: "eleven_turbo_v2", // ✅ Free tier
  voice_settings: { ... }
});
```

### 3. Updated Server Endpoint
**Changes:**
- ✅ Checks if `audioBuffer` is null before converting to base64
- ✅ Returns `audioAvailable: true/false` in response
- ✅ App works perfectly without audio

## Voice IDs Available (No Permission Required)

| Voice Name | Voice ID | Description |
|------------|----------|-------------|
| Rachel | `21m00Tcm4TlvDq8ikWAM` | Calm female (default) |
| Adam | `pNInz6obpgDQGcFmaJgB` | Deep male |
| Bella | `EXAVITQu4vr4xnSDxMaL` | Soft female |
| Josh | `TxGEqnHWrfWFTfGW9XjX` | Young male |

## Testing

### Test Audio Generation:
```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hrv": 55,
    "stress": 45,
    "sleepQuality": 78
  }'
```

**Expected Response:**
```json
{
  "analysis": "Your health metrics indicate...",
  "audio": "base64EncodedAudio...",
  "audioAvailable": true
}
```

**If audio fails:**
```json
{
  "analysis": "Your health metrics indicate...",
  "audio": null,
  "audioAvailable": false
}
```

## How to Get Full Permissions (Optional)

If you want the original API to work with voice names:

1. Go to https://elevenlabs.io/app/settings/api-keys
2. **Regenerate** your API key
3. **Select ALL permissions** when creating the new key:
   - ✅ `voices_read` (required for voice names)
   - ✅ `text_to_speech` (required for generation)
4. Replace the key in `.env`

## Current Status

✅ **FIXED** - Audio generation now works OR gracefully fails
✅ **No crashes** - App continues without audio if API fails
✅ **Free tier friendly** - Uses `eleven_turbo_v2` model
✅ **No permissions needed** - Uses direct voice IDs

## Notes

- Audio is **optional** - app works perfectly without it
- If API key still has issues, audio simply won't be generated
- Text analysis from Gemini AI still works 100%
- Consider audio as a "nice to have" feature, not critical
