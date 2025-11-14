import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import WelcomeScreen from './screens/onboarding/WelcomeScreen';
import PermissionsScreen from './screens/onboarding/PermissionsScreen';
import DataSourcesScreen from './screens/onboarding/DataSourcesScreen';
import TriggerPersonalizationScreen from './screens/onboarding/TriggerPersonalizationScreen';
import DashboardIntroScreen from './screens/onboarding/DashboardIntroScreen';
import DashboardScreen from './screens/DashboardScreen';
import '../global.css';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      >
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
          }}
        />
        <Stack.Screen 
          name="Permissions" 
          component={PermissionsScreen} 
        />
        <Stack.Screen 
          name="DataSources" 
          component={DataSourcesScreen} 
        />
        <Stack.Screen 
          name="TriggerPersonalization" 
          component={TriggerPersonalizationScreen} 
        />
        <Stack.Screen 
          name="DashboardIntro" 
          component={DashboardIntroScreen} 
        />
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid,
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
