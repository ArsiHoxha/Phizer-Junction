import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import type { TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: string;
}

export function Button({ 
  title, 
  variant = 'primary', 
  size = 'medium',
  loading = false,
  icon,
  disabled,
  className = '',
  ...props 
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-black',
    secondary: 'bg-gray-700',
    outline: 'bg-white border-2 border-black',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-black',
  };

  const sizeStyles = {
    small: 'py-3 px-6',
    medium: 'py-4 px-8',
    large: 'py-5 px-10',
  };

  const textSizeStyles = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <TouchableOpacity
      className={`rounded-full items-center justify-center ${variantStyles[variant]} ${sizeStyles[size]} ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#000' : '#fff'} />
      ) : (
        <View className="flex-row items-center">
          {icon && <Text className="text-xl mr-2">{icon}</Text>}
          <Text className={`${textStyles[variant]} ${textSizeStyles[size]} font-semibold`}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export function Card({ children, variant = 'default', className = '' }: CardProps) {
  const variantStyles = {
    default: 'bg-white',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-200',
  };

  return (
    <View className={`rounded-3xl p-6 ${variantStyles[variant]} ${className}`}>
      {children}
    </View>
  );
}

interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'small' | 'medium';
}

export function Badge({ text, variant = 'neutral', size = 'medium' }: BadgeProps) {
  const variantStyles = {
    success: 'bg-green-100 border-green-300',
    warning: 'bg-yellow-100 border-yellow-300',
    danger: 'bg-red-100 border-red-300',
    neutral: 'bg-gray-100 border-gray-300',
  };

  const textStyles = {
    success: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700',
    neutral: 'text-gray-700',
  };

  const sizeStyles = {
    small: 'px-3 py-1 text-xs',
    medium: 'px-4 py-2 text-sm',
  };

  return (
    <View className={`rounded-full border ${variantStyles[variant]} ${sizeStyles[size]}`}>
      <Text className={`${textStyles[variant]} font-medium`}>{text}</Text>
    </View>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export function ProgressBar({ 
  progress, 
  height = 8, 
  color = 'bg-black',
  backgroundColor = 'bg-gray-200',
  className = '' 
}: ProgressBarProps) {
  return (
    <View className={`rounded-full overflow-hidden ${backgroundColor} ${className}`} style={{ height }}>
      <View 
        className={`h-full rounded-full ${color}`}
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />
    </View>
  );
}

interface DividerProps {
  className?: string;
}

export function Divider({ className = '' }: DividerProps) {
  return <View className={`h-px bg-gray-200 ${className}`} />;
}
