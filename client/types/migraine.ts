/**
 * Migraine Phase Types
 * Based on medical literature - 4 distinct phases of migraine
 * All detected passively by AI, not manually logged
 */

export type MigrainePhase = 'prodrome' | 'aura' | 'headache' | 'postdrome';

export interface PhaseTimestamps {
  prodromeStart?: Date;    // When AI detected early warning signs (HRV drop, stress rise)
  auraStart?: Date;        // When AI detected aura symptoms (20-60 min before)
  headacheStart: Date;     // When user confirmed migraine
  postdromeStart?: Date;   // When headache ends, fatigue begins
  resolved?: Date;         // When all symptoms clear
}

/**
 * Prodrome Symptoms (Early Warning Phase)
 * Hours to days before headache
 * Detected from: phone usage patterns, activity levels, HRV changes
 */
export type ProdromeSymptom = 
  | 'mood_changes'              // Phone usage patterns, app choices
  | 'neck_stiffness'            // Posture data (if available)
  | 'food_cravings'             // Calendar/activity patterns
  | 'increased_urination'       // Hard to detect passively
  | 'yawning'                   // Hard to detect passively
  | 'concentration_difficulty'  // Screen time, app switching
  | 'fatigue';                  // Activity levels, HRV

/**
 * Aura Symptoms (Pre-Headache Phase)
 * 20-60 minutes before headache
 * Mostly difficult to detect passively - requires user reporting
 */
export type AuraSymptom =
  | 'visual_disturbances'  // Zigzag lines, flashing lights, blind spots
  | 'sensory_changes'      // Tingling, numbness
  | 'speech_difficulty'    // Hard to detect passively
  | 'motor_weakness';      // Could detect from movement data

/**
 * Headache Phase Symptoms (Main Attack)
 * 4-72 hours typically
 * Some can be inferred from passive data (light sensitivity from screen brightness)
 */
export type HeadacheSymptom =
  | 'throbbing_pain'        // User confirms
  | 'nausea'                // User reports
  | 'light_sensitivity'     // Screen brightness drops
  | 'sound_sensitivity'     // Volume changes, quiet seeking
  | 'worse_with_activity'   // Movement data shows stillness
  | 'dizziness'             // User reports
  | 'one_sided_pain';       // User reports

/**
 * Postdrome Symptoms (Recovery Phase)
 * Hours to days after headache
 * Detected from: activity levels, HRV recovery, phone usage
 */
export type PostdromeSymptom =
  | 'exhaustion'
  | 'confusion'
  | 'mood_changes'
  | 'dizziness'
  | 'weakness'
  | 'difficulty_concentrating';

export interface DetectedSymptoms {
  prodrome: ProdromeSymptom[];
  aura: AuraSymptom[];
  headache: HeadacheSymptom[];
  postdrome: PostdromeSymptom[];
}

export interface EarlyWarningSignal {
  metric: string;      // 'hrv', 'stress', 'sleep', 'heart_rate'
  value: number;
  deviation: number;   // How much it deviated from baseline
  timestamp: Date;
}

export interface PhaseRecommendation {
  phase: MigrainePhase;
  action: string;
  timing: 'immediate' | 'preventive' | 'recovery';
}

export interface SimilarPattern {
  date: Date;
  similarity: number;  // 0-100
  phase: MigrainePhase;
}

export interface MigraineAIAnalysis {
  confidence: number;          // 0-100
  detectedPhase: MigrainePhase;
  phaseConfidence: number;     // Confidence in phase detection
  primaryCauses: {
    factor: string;
    contribution: number;      // percentage
    explanation: string;
  }[];
  recommendations: PhaseRecommendation[];
  similarPatterns: SimilarPattern[];
  earlyWarningSignals: EarlyWarningSignal[];
  analysisTimestamp: Date;
}

export interface MetricsSnapshot {
  hrv?: number;
  heartRate?: number;
  stress?: number;
  sleepQuality?: number;
  sleepHours?: number;
  screenTime?: number;
  weather?: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    condition?: string;
  };
  calendarLoad?: number;
}

/**
 * Complete Migraine Log Entry
 * User only taps "I have a migraine" - AI fills in everything else passively
 */
export interface MigraineLog {
  _id: string;
  userId: string;
  clerkId: string;
  timestamp: Date;
  
  // Current severity (1-10, user can optionally provide)
  severity: number;
  
  // AI-detected phase information
  phase: MigrainePhase;
  phaseTimestamps: PhaseTimestamps;
  detectedSymptoms: DetectedSymptoms;
  
  // Optional user notes
  notes?: string;
  
  // Passive data captured at migraine time
  metricsSnapshot: MetricsSnapshot;
  activeTriggers: string[];
  
  // AI analysis (generated after logging)
  aiAnalysis?: MigraineAIAnalysis;
  
  // Outcome tracking
  duration?: number;           // minutes
  medicationTaken?: string;
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Quick log request - minimal user input
 * AI fills in phase, symptoms, and analysis automatically
 */
export interface QuickLogRequest {
  severity?: number;  // Optional - AI can infer from metrics
  notes?: string;     // Optional quick note
  currentMetrics?: MetricsSnapshot;  // Send current frontend data to ensure we have metrics
}

/**
 * Detailed log request - for power users who want more control
 * Still mostly passive, but allows confirmation of AI detections
 */
export interface DetailedLogRequest {
  severity: number;
  confirmedSymptoms?: {
    prodrome?: ProdromeSymptom[];
    aura?: AuraSymptom[];
    headache?: HeadacheSymptom[];
  };
  notes?: string;
  medicationTaken?: string;
}
