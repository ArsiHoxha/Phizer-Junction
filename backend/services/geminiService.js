const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI('AIzaSyCR2rMxmJxiC44jnCtvfS-bqLGJhoXQq4c');

async function analyzeHealthData(healthData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are a medical AI assistant specialized in migraine analysis and prevention. Analyze the following health data and provide personalized insights.

Health Data:
- HRV (Heart Rate Variability): ${healthData.wearable?.hrv || 'N/A'}ms (Normal: 60-80ms)
- Heart Rate: ${healthData.wearable?.heartRate || 'N/A'} bpm
- Stress Level: ${healthData.wearable?.stress || 'N/A'}% (0-100)
- Sleep Quality: ${healthData.wearable?.sleepQuality || 'N/A'}%
- Sleep Duration: ${healthData.sleep?.totalSleepMinutes ? (healthData.sleep.totalSleepMinutes / 60).toFixed(1) : 'N/A'} hours
- Sleep Debt: ${healthData.sleep?.sleepDebt || 'N/A'} hours
- Screen Time: ${healthData.phone?.screenTimeMinutes ? (healthData.phone.screenTimeMinutes / 60).toFixed(1) : 'N/A'} hours today
- Notifications: ${healthData.phone?.notificationCount || 'N/A'}
- Activity Level: ${healthData.phone?.activityLevel || 'N/A'}
- Weather: ${healthData.location?.weather?.temperature?.toFixed(1) || 'N/A'}°C, ${healthData.location?.weather?.humidity?.toFixed(0) || 'N/A'}% humidity
- Barometric Pressure: ${healthData.location?.weather?.pressure?.toFixed(0) || 'N/A'} hPa
- UV Index: ${healthData.location?.weather?.uvIndex?.toFixed(1) || 'N/A'}
- Calendar Events Today: ${healthData.calendar?.eventsToday || 'N/A'}
- Calendar Stress Score: ${healthData.calendar?.stressScore || 'N/A'}%
- Current Risk Score: ${healthData.currentRisk || 'N/A'}%

Please provide:
1. **Primary Concerns**: Identify the top 2-3 most concerning metrics that could trigger a migraine
2. **Root Cause Analysis**: Explain what's causing these issues based on the data patterns
3. **Immediate Actions**: 3-4 specific, actionable recommendations the user should take right now
4. **Prevention Tips**: 2-3 lifestyle adjustments for long-term migraine prevention

Keep your response concise (max 250 words), empathetic, and actionable. Focus on migraine-specific triggers.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      analysis: text,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      success: false,
      error: error.message,
      analysis: 'Unable to generate AI insights at this time. Please try again later.',
    };
  }
}

async function getTriggerInsights(triggerData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a migraine specialist AI. Analyze these trigger factors and explain their impact:

Active Triggers:
${triggerData.map(t => `- ${t.name}: ${t.impact}% impact (${t.active ? 'Active' : 'Inactive'})`).join('\n')}

Provide:
1. Which trigger is most concerning and why
2. How these triggers interact with each other
3. One specific action to reduce the highest impact trigger

Keep response under 100 words. Be direct and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      insights: text,
    };
  } catch (error) {
    console.error('Gemini AI Error:', error);
    return {
      success: false,
      insights: 'Unable to analyze triggers at this time.',
    };
  }
}

module.exports = {
  analyzeHealthData,
  getTriggerInsights,
};
