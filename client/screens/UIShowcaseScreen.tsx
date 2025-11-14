import React from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { Button, Card, Badge, ProgressBar, Divider } from '../components/ui/UIComponents';

export default function UIShowcaseScreen() {
  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-8">
          <Text className="text-3xl font-bold text-black mb-2">
            UI Components Showcase
          </Text>
          <Text className="text-base text-gray-600">
            Reusable components for Migraine Guardian
          </Text>
        </View>

        {/* Buttons Section */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-semibold text-black mb-4">Buttons</Text>
          
          <Text className="text-sm text-gray-600 mb-2">Primary</Text>
          <Button title="Get Started" variant="primary" className="mb-3" />
          
          <Text className="text-sm text-gray-600 mb-2">Secondary</Text>
          <Button title="Learn More" variant="secondary" className="mb-3" />
          
          <Text className="text-sm text-gray-600 mb-2">Outline</Text>
          <Button title="Cancel" variant="outline" className="mb-3" />
          
          <Text className="text-sm text-gray-600 mb-2">With Icon</Text>
          <Button title="Continue" variant="primary" icon="→" className="mb-3" />
          
          <Text className="text-sm text-gray-600 mb-2">Loading State</Text>
          <Button title="Loading..." variant="primary" loading className="mb-3" />
          
          <Text className="text-sm text-gray-600 mb-2">Disabled</Text>
          <Button title="Disabled" variant="primary" disabled className="mb-3" />
          
          <Text className="text-sm text-gray-600 mb-2">Sizes</Text>
          <Button title="Small" variant="primary" size="small" className="mb-2" />
          <Button title="Medium" variant="primary" size="medium" className="mb-2" />
          <Button title="Large" variant="primary" size="large" className="mb-3" />
        </View>

        <Divider className="mx-6 mb-8" />

        {/* Cards Section */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-semibold text-black mb-4">Cards</Text>
          
          <Text className="text-sm text-gray-600 mb-2">Default Card</Text>
          <Card className="mb-3">
            <Text className="text-lg font-semibold text-black mb-2">Card Title</Text>
            <Text className="text-gray-600">This is a default card component with some sample content.</Text>
          </Card>
          
          <Text className="text-sm text-gray-600 mb-2">Elevated Card</Text>
          <Card variant="elevated" className="mb-3">
            <Text className="text-lg font-semibold text-black mb-2">Elevated Card</Text>
            <Text className="text-gray-600">This card has a shadow for depth.</Text>
          </Card>
          
          <Text className="text-sm text-gray-600 mb-2">Outlined Card</Text>
          <Card variant="outlined" className="mb-3">
            <Text className="text-lg font-semibold text-black mb-2">Outlined Card</Text>
            <Text className="text-gray-600">This card has a border.</Text>
          </Card>
        </View>

        <Divider className="mx-6 mb-8" />

        {/* Badges Section */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-semibold text-black mb-4">Badges</Text>
          
          <View className="flex-row flex-wrap gap-2 mb-3">
            <Badge text="Success" variant="success" />
            <Badge text="Warning" variant="warning" />
            <Badge text="Danger" variant="danger" />
            <Badge text="Neutral" variant="neutral" />
          </View>
          
          <Text className="text-sm text-gray-600 mb-2">Small Size</Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            <Badge text="Low Risk" variant="success" size="small" />
            <Badge text="Medium Risk" variant="warning" size="small" />
            <Badge text="High Risk" variant="danger" size="small" />
          </View>
        </View>

        <Divider className="mx-6 mb-8" />

        {/* Progress Bars Section */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-semibold text-black mb-4">Progress Bars</Text>
          
          <Text className="text-sm text-gray-600 mb-2">25% Progress</Text>
          <ProgressBar progress={25} className="mb-4" />
          
          <Text className="text-sm text-gray-600 mb-2">50% Progress</Text>
          <ProgressBar progress={50} className="mb-4" />
          
          <Text className="text-sm text-gray-600 mb-2">75% Progress</Text>
          <ProgressBar progress={75} className="mb-4" />
          
          <Text className="text-sm text-gray-600 mb-2">100% Progress</Text>
          <ProgressBar progress={100} className="mb-4" />
          
          <Text className="text-sm text-gray-600 mb-2">Custom Colors</Text>
          <ProgressBar progress={60} color="bg-red-500" className="mb-2" />
          <ProgressBar progress={60} color="bg-green-500" className="mb-2" />
          <ProgressBar progress={60} color="bg-blue-500" className="mb-4" />
        </View>

        {/* Typography Section */}
        <View className="px-6 mb-8">
          <Text className="text-xl font-semibold text-black mb-4">Typography</Text>
          
          <Text className="text-4xl font-bold text-black mb-2">Heading 1</Text>
          <Text className="text-3xl font-bold text-black mb-2">Heading 2</Text>
          <Text className="text-2xl font-bold text-black mb-2">Heading 3</Text>
          <Text className="text-xl font-semibold text-black mb-2">Heading 4</Text>
          <Text className="text-lg font-semibold text-black mb-3">Heading 5</Text>
          
          <Text className="text-base text-gray-900 mb-2">
            Body text - Regular weight for main content
          </Text>
          <Text className="text-base text-gray-600 mb-2">
            Secondary text - Gray for less important content
          </Text>
          <Text className="text-sm text-gray-500 mb-2">
            Caption text - Smaller size for captions and labels
          </Text>
          <Text className="text-xs text-gray-400">
            Tiny text - For fine print and metadata
          </Text>
        </View>

        {/* Color Palette Section */}
        <View className="px-6 mb-16">
          <Text className="text-xl font-semibold text-black mb-4">Color Palette</Text>
          
          <View className="flex-row flex-wrap -mx-1 mb-3">
            <View className="w-1/3 px-1 mb-2">
              <View className="bg-black h-20 rounded-xl items-center justify-center">
                <Text className="text-white text-xs">Black</Text>
              </View>
            </View>
            <View className="w-1/3 px-1 mb-2">
              <View className="bg-white h-20 rounded-xl items-center justify-center border border-gray-200">
                <Text className="text-black text-xs">White</Text>
              </View>
            </View>
          </View>
          
          <Text className="text-sm text-gray-600 mb-2">Gray Scale</Text>
          <View className="flex-row flex-wrap -mx-1">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
              <View key={shade} className="w-1/5 px-1 mb-2">
                <View 
                  className={`bg-gray-${shade} h-16 rounded-xl items-center justify-center`}
                >
                  <Text className={`text-xs ${shade < 500 ? 'text-gray-900' : 'text-white'}`}>
                    {shade}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
