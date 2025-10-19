import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import JournalScreen from './screens/JournalScreen';
import { useFonts } from "expo-font";
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useEffect } from "react";

export default function App() {
  const [fontsLoaded] = useFonts({
    'AbhayaLibre-ExtraBold': require('./assets/fonts/AbhayaLibre-ExtraBold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        await ExpoSplashScreen.hideAsync();
      }
    }
    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer>
      {/* TEMP: expose Journal screen directly for testing */}
      <AppNavigator />
    </NavigationContainer>
  );
}
