import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import {useFonts} from "expo-font";
import * as ExpoSplashScreen from 'expo-splash-screen';
import {useEffect} from "react";

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
      {/* AppNavigator should contain your tab/stack setup (e.g., bottom tabs) */}
      <AppNavigator />
    </NavigationContainer>
  );
}