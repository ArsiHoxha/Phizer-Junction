const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with your API key
const genAI = new GoogleGenerativeAI('AIzaSyCR2rMxmJxiC44jnCtvfS-bqLGJhoXQq4c');

async function analyzeHealthData(healthData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Build trigger analysis section
    let triggerSection = '';
    if (healthData.activeTriggers && healthData.activeTriggers.length > 0) {
      triggerSection = `\nUSER-SELECTED TRIGGERS (From Onboarding):
${healthData.userTriggers ? healthData.userTriggers.map(t => `- ${t}`).join('\n') : 'None selected'}

ACTIVE TRIGGERS DETECTED NOW:
${healthData.activeTriggers.map(t => `- ${t.name}: ${t.value} → ${Math.round(t.impact)}% risk impact (${t.type === 'user' ? 'User selected' : 'Core metric'})`).join('\n')}`;
    }

    // Build intake section
    let intakeSection = '';
    if (healthData.intakeData) {
      intakeSection = `\nDAILY INTAKE:
- Water: ${healthData.intakeData.water}/8 glasses (${healthData.intakeData.water < 6 ? 'LOW - Dehydration risk!' : 'Good'})
- Coffee: ${healthData.intakeData.coffee} cups (${healthData.intakeData.coffee >= 3 ? 'HIGH - May trigger migraine!' : 'Moderate'})`;
    }

    const prompt = `You are a medical AI assistant specialized in migraine analysis and prevention. Analyze the following health data and provide personalized insights.

CORE HEALTH METRICS:
- HRV (Heart Rate Variability): ${healthData.wearable?.hrv || 'N/A'}ms (Normal: 60-80ms)
- Heart Rate: ${healthData.wearable?.heartRate || 'N/A'} bpm
- Stress Level: ${healthData.wearable?.stress || 'N/A'}% (0-100)
- Sleep Quality: ${healthData.wearable?.sleepQuality || 'N/A'}%
- Sleep Duration: ${healthData.sleep?.totalSleepMinutes ? (healthData.sleep.totalSleepMinutes / 60).toFixed(1) : 'N/A'} hours
- Sleep Debt: ${healthData.sleep?.sleepDebt || 'N/A'} hours
- Screen Time: ${healthData.phone?.screenTimeMinutes ? (healthData.phone.screenTimeMinutes / 60).toFixed(1) : 'N/A'} hours today
- Notifications: ${healthData.phone?.notificationCount || 'N/A'}
- Activity Level: ${healthData.phone?.activityLevel || 'N/A'}

ENVIRONMENTAL DATA:
- Weather: ${healthData.location?.weather?.temperature?.toFixed(1) || 'N/A'}°C, ${healthData.location?.weather?.humidity?.toFixed(0) || 'N/A'}% humidity
- Barometric Pressure: ${healthData.location?.weather?.pressure?.toFixed(0) || 'N/A'} hPa (Low pressure < 1010 = migraine trigger!)
- UV Index: ${healthData.location?.weather?.uvIndex?.toFixed(1) || 'N/A'}
- Calendar Events Today: ${healthData.calendar?.eventsToday || 'N/A'}
- Calendar Stress Score: ${healthData.calendar?.stressScore || 'N/A'}%
${intakeSection}
${triggerSection}

CURRENT MIGRAINE RISK: ${healthData.currentRisk || 'N/A'}%

IMPORTANT: Focus your analysis on the USER-SELECTED TRIGGERS and ACTIVE TRIGGERS above. These are the specific migraine triggers this person experiences. Analyze how their current metrics relate to THEIR specific triggers, not generic advice.

Format your response EXACTLY like this with proper structure:

PRIMARY CONCERNS
• [First concerning trigger with its VALUE - e.g., "HRV at 42ms (Low)"]
• [Second concerning trigger with its VALUE]
• [Third concerning trigger with VALUE if applicable]

ROOT CAUSE ANALYSIS
• [How the active triggers are interconnected - mention specific VALUES]
• [Patterns in user's selected triggers vs current data]
• [Environmental or lifestyle factors contributing]

IMMEDIATE ACTIONS
• [First specific action targeting highest-impact user trigger]
• [Second action for next highest trigger]
• [Third action addressing environmental factors]
• [Fourth action for prevention]

PREVENTION TIPS
• [Long-term adjustment for user's #1 trigger]
• [Lifestyle change for user's #2 trigger]
• [General migraine prevention specific to their pattern]

Keep it concise (max 300 words), empathetic, and actionable. Focus on the USER'S SPECIFIC TRIGGERS from onboarding.`;

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

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
