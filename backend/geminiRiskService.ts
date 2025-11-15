/**
 * Gemini AI Risk Calculation Service
 * Uses Google Gemini 1.5 Flash to intelligently calculate migraine risk
 * Based on comprehensive health metrics and medical knowledge
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyCIk9pAnIGiboEWN-del5kI9rQsnmIejjE';

interface HealthMetrics {
  hrv: number;
  heartRate: number;
  stress: number;
  sleepQuality: number;
  sleepHours: number;
  steps: number;
  screenTimeMinutes: number;
  notificationCount: number;
  activityLevel: string;
  temperature: number;
  humidity: number;
  pressure: number;
  uvIndex: number;
  calendarEvents: number;
  calendarStress: number;
}

interface RiskAnalysis {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  primaryTriggers: string[];
  reasoning: string;
  recommendations: string[];
}

class GeminiRiskService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private lastCalculation: number = 0;
  private cachedResult: RiskAnalysis | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ Gemini API key not found. Risk calculation will return default values.');
    }
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  }

  /**
   * Calculate migraine risk using Gemini AI
   */
  async calculateRisk(metrics: HealthMetrics): Promise<RiskAnalysis> {
    // Return cached result if still valid
    const now = Date.now();
    if (this.cachedResult && (now - this.lastCalculation) < this.CACHE_DURATION) {
      console.log('🤖 Using cached Gemini risk analysis');
      return this.cachedResult;
    }

    if (!GEMINI_API_KEY) {
      console.warn('⚠️ EXPO_PUBLIC_GEMINI_API_KEY not found in environment variables');
      return this.getDefaultAnalysis(metrics);
    }

    try {
      console.log('🤖 Calculating migraine risk with Gemini AI 2.0-flash-exp...');
      console.log('📊 Metrics:', {
        hrv: metrics.hrv,
        stress: metrics.stress,
        sleepQuality: metrics.sleepQuality,
        pressure: metrics.pressure,
      });

      const prompt = this.buildPrompt(metrics);
      console.log('📝 Sending prompt to Gemini (length:', prompt.length, 'chars)');
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Received response from Gemini (length:', text.length, 'chars)');

      // Parse JSON response from Gemini
      const analysis = this.parseGeminiResponse(text);
      
      this.cachedResult = analysis;
      this.lastCalculation = now;

      console.log(`🤖 Gemini Risk Analysis: ${analysis.riskScore}% (${analysis.riskLevel})`);
      console.log(`🎯 Primary Triggers: ${analysis.primaryTriggers.join(', ')}`);

      return analysis;
    } catch (error: any) {
      console.error('❌ Error calculating risk with Gemini:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      return this.getDefaultAnalysis(metrics);
    }
  }

  /**
   * Build comprehensive prompt for Gemini AI
   */
  private buildPrompt(metrics: HealthMetrics): string {
    return `You are a medical AI assistant specializing in migraine prediction. Analyze the following health metrics and calculate migraine risk.

**Current Health Metrics:**
- Heart Rate Variability (HRV): ${metrics.hrv}ms (Normal: 50-100ms, Low: <40ms indicates high ANS stress)
- Heart Rate: ${metrics.heartRate} BPM (Normal: 60-80 BPM)
- Stress Level: ${metrics.stress}% (0-100 scale)
- Sleep Quality: ${metrics.sleepQuality}% (0-100 scale)
- Sleep Duration: ${metrics.sleepHours} hours (Optimal: 7-9 hours)
- Daily Steps: ${metrics.steps} steps
- Screen Time: ${metrics.screenTimeMinutes} minutes
- Notifications: ${metrics.notificationCount} today
- Activity Level: ${metrics.activityLevel}
- Temperature: ${metrics.temperature}°C
- Humidity: ${metrics.humidity}%
- Barometric Pressure: ${metrics.pressure} hPa (Low pressure <1010 is a major migraine trigger)
- UV Index: ${metrics.uvIndex} (0-11+ scale)
- Calendar Events: ${metrics.calendarEvents} events today
- Calendar Stress: ${metrics.calendarStress}% (0-100 scale)

**Medical Knowledge:**
Major migraine triggers include:
1. Low HRV (<40ms) - indicates autonomic nervous system dysfunction
2. Poor sleep (<6 hours or quality <60%)
3. High stress (>70%)
4. Low barometric pressure (<1010 hPa)
5. Excessive screen time (>6 hours) + bright light
6. Dehydration (inferred from low activity + high stress)
7. Skipped meals (inferred from busy schedule)
8. Weather changes (pressure, humidity, temperature extremes)

**Task:**
Calculate a migraine risk score (0-100) based on:
- Severity of each trigger present
- Number of simultaneous triggers (synergistic effects)
- Medical research on trigger weights

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "riskScore": <number 0-100>,
  "riskLevel": "<LOW|MODERATE|HIGH|CRITICAL>",
  "primaryTriggers": ["<trigger1>", "<trigger2>", ...],
  "reasoning": "<brief explanation of why this risk score>",
  "recommendations": ["<action1>", "<action2>", ...]
}

Risk Level Guidelines:
- LOW: 0-29% (1-2 mild triggers)
- MODERATE: 30-59% (2-3 moderate triggers)
- HIGH: 60-79% (3-4 severe triggers)
- CRITICAL: 80-100% (4+ severe triggers, multiple systems affected)`;
  }

  /**
   * Parse Gemini's JSON response
   */
  private parseGeminiResponse(text: string): RiskAnalysis {
    try {
      console.log('🔍 Parsing Gemini response...');
      
      // Remove markdown code blocks if present
      let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to extract JSON if it's embedded in text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      console.log('📄 Cleaned JSON text (first 200 chars):', jsonText.substring(0, 200));
      
      const parsed = JSON.parse(jsonText);
      
      console.log('✅ Successfully parsed JSON:', {
        hasRiskScore: 'riskScore' in parsed,
        hasRiskLevel: 'riskLevel' in parsed,
        hasTriggers: 'primaryTriggers' in parsed,
      });
      
      // Validate and sanitize
      return {
        riskScore: Math.max(0, Math.min(100, Number(parsed.riskScore) || 0)),
        riskLevel: parsed.riskLevel || 'MODERATE',
        primaryTriggers: Array.isArray(parsed.primaryTriggers) ? parsed.primaryTriggers : [],
        reasoning: parsed.reasoning || 'Analysis completed',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    } catch (error: any) {
      console.error('❌ Error parsing Gemini response:', error?.message);
      console.error('📄 Full raw response:', text);
      console.error('❌ Parse error details:', error);
      throw new Error(`Failed to parse Gemini response: ${error?.message}`);
    }
  }

  /**
   * Fallback analysis when Gemini is unavailable
   */
  private getDefaultAnalysis(metrics: HealthMetrics): RiskAnalysis {
    console.log('⚠️ Using fallback risk calculation (Gemini unavailable)');
    
    // Simple rule-based fallback
    let score = 20; // Base risk
    const triggers: string[] = [];

    if (metrics.hrv < 40) {
      score += 25;
      triggers.push('Critical HRV');
    }
    if (metrics.stress > 70) {
      score += 20;
      triggers.push('High Stress');
    }
    if (metrics.sleepHours < 6 || metrics.sleepQuality < 60) {
      score += 15;
      triggers.push('Poor Sleep');
    }
    if (metrics.pressure < 1010) {
      score += 15;
      triggers.push('Low Pressure');
    }
    if (metrics.screenTimeMinutes > 360) {
      score += 10;
      triggers.push('High Screen Time');
    }

    score = Math.min(100, score);

    return {
      riskScore: score,
      riskLevel: score > 80 ? 'CRITICAL' : score > 60 ? 'HIGH' : score > 30 ? 'MODERATE' : 'LOW',
      primaryTriggers: triggers,
      reasoning: 'Fallback analysis - Gemini AI unavailable',
      recommendations: ['Install Gemini API key for intelligent analysis'],
    };
  }

  /**
   * Clear cache (force new calculation)
   */
  public clearCache() {
    this.cachedResult = null;
    this.lastCalculation = 0;
  }
}

// Singleton instance
let instance: GeminiRiskService | null = null;

export function getGeminiRiskService(): GeminiRiskService {
  if (!instance) {
    instance = new GeminiRiskService();
  }
  return instance;
}

export default getGeminiRiskService;
