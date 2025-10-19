import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <NavigationContainer>
      {/* AppNavigator should contain your tab/stack setup (e.g., bottom tabs) */}
      <AppNavigator />
    </NavigationContainer>
  );
}