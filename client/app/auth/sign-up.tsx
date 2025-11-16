import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    if (!isLoaded) return;

    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      // For demo purposes, we'll skip verification
      // In production, you'd navigate to verification screen
      const result = await setActive({ session: signUp.createdSessionId });
      
      router.replace('/onboarding/intro');
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert('Error', err.errors?.[0]?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <View className="flex-1 px-8 pt-20">
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(800)}>
          <Text className="text-4xl font-bold text-black mb-3">
            Create Account
          </Text>
          <Text className="text-base text-gray-600 mb-8">
            Join Migraine Guardian today
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInUp.duration(800).delay(200)}>
          <View className="flex-row gap-3 mb-5">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">First Name</Text>
              <TextInput
                className="bg-gray-50 border-2 border-gray-200 rounded-2xl px-5 py-4 text-base"
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-2">Last Name</Text>
              <TextInput
                className="bg-gray-50 border-2 border-gray-200 rounded-2xl px-5 py-4 text-base"
                placeholder="Doe"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
          <TextInput
            className="bg-gray-50 border-2 border-gray-200 rounded-2xl px-5 py-4 text-base mb-5"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
          <TextInput
            className="bg-gray-50 border-2 border-gray-200 rounded-2xl px-5 py-4 text-base mb-8"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={onSignUp}
            disabled={loading}
            className="bg-black rounded-full py-5 mb-4"
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                Sign Up
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View className="flex-row justify-center">
            <Text className="text-gray-600">Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
              <Text className="text-black font-semibold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Back Button */}
      <View className="px-8 pb-8">
        <TouchableOpacity
          onPress={() => router.back()}
          className="py-4"
        >
          <Text className="text-gray-500 text-center">Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
