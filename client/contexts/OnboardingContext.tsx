import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingData {
  permissions?: {
    notifications: boolean;
    passiveData: boolean;
    location: boolean;
  };
  profile?: {
    gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
    age?: number;
  };
  menstrualTracking?: {
    enabled: boolean;
    cycleLength?: number;
    lastPeriodDate?: string;
  };
  triggers?: string[];
  dataSource?: {
    mode: 'phone' | 'wearable';
    wearableType?: string;
  };
}

interface OnboardingContextType {
  onboardingData: OnboardingData;
  setPermissions: (permissions: OnboardingData['permissions']) => void;
  setProfile: (profile: OnboardingData['profile']) => void;
  setMenstrualTracking: (menstrualTracking: OnboardingData['menstrualTracking']) => void;
  setTriggers: (triggers: string[]) => void;
  setDataSource: (dataSource: OnboardingData['dataSource']) => void;
  clearOnboardingData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  const setPermissions = (permissions: OnboardingData['permissions']) => {
    setOnboardingData(prev => ({ ...prev, permissions }));
  };

  const setProfile = (profile: OnboardingData['profile']) => {
    setOnboardingData(prev => ({ ...prev, profile }));
  };

  const setMenstrualTracking = (menstrualTracking: OnboardingData['menstrualTracking']) => {
    setOnboardingData(prev => ({ ...prev, menstrualTracking }));
  };

  const setTriggers = (triggers: string[]) => {
    setOnboardingData(prev => ({ ...prev, triggers }));
  };

  const setDataSource = (dataSource: OnboardingData['dataSource']) => {
    setOnboardingData(prev => ({ ...prev, dataSource }));
  };

  const clearOnboardingData = () => {
    setOnboardingData({});
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingData,
        setPermissions,
        setProfile,
        setMenstrualTracking,
        setTriggers,
        setDataSource,
        clearOnboardingData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
