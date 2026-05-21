import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0066CC',
    secondary: '#FFB84D',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    error: '#FF5252',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onBackground: '#333333',
    onSurface: '#333333',
  },
  fonts: {
    ...MD3LightTheme.fonts,
  },
};

export const colors = {
  primary: '#0066CC',
  secondary: '#FFB84D',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  success: '#4CAF50',
  highlight: '#E3F2FD',
  border: '#E0E0E0',
};