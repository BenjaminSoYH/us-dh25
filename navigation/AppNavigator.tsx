import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from '../screens/LoginAndRegisterScreen';
import { View, Text } from 'react-native';

// TEMP placeholder so navigation.navigate('CoupleGate') won't crash.
// We'll replace this with the real pairing flow later.
function CoupleGateScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>CoupleGate (placeholder)</Text>
    </View>
  );
}

export type RootStackParamList = {
  SignIn: undefined;
  CoupleGate: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="SignIn" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="CoupleGate" component={CoupleGateScreen} />
    </Stack.Navigator>
  );
}