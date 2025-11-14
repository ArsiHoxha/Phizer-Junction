import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingData {
  permissions?: {
    notifications: boolean;
    passiveData: boolean;
    calendar: boolean;
    location: boolean;
  };
  dataSource?: {
    mode: 'phone' | 'wearable';
    wearableType?: string;
  };
  triggers?: {
    frequency: string;
    triggers: string[];
  };
}

interface OnboardingContextType {
  onboardingData: OnboardingData;
  setPermissions: (permissions: OnboardingData['permissions']) => void;
  setDataSource: (dataSource: OnboardingData['dataSource']) => void;
  setTriggers: (triggers: OnboardingData['triggers']) => void;
  clearOnboardingData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});

  const setPermissions = (permissions: OnboardingData['permissions']) => {
    setOnboardingData(prev => ({ ...prev, permissions }));
  };

  const setDataSource = (dataSource: OnboardingData['dataSource']) => {
    setOnboardingData(prev => ({ ...prev, dataSource }));
  };

  const setTriggers = (triggers: OnboardingData['triggers']) => {
    setOnboardingData(prev => ({ ...prev, triggers }));
  };

  const clearOnboardingData = () => {
    setOnboardingData({});
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingData,
        setPermissions,
        setDataSource,
        setTriggers,
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
