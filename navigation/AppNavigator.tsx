// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from '../screens/LoginAndRegisterScreen';
import CoupleGateScreen from '../screens/CoupleGateScreen';

const CreateCouplePlaceholder = () => (
  <></>
);
const JoinCouplePlaceholder = () => (
  <></>
);


export type RootStackParamList = {
  SignIn: undefined;
  CoupleGate: undefined;
  CreateCouple: undefined;
  JoinCouple: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="SignIn" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="CoupleGate" component={CoupleGateScreen} />
      <Stack.Screen name="CreateCouple" component={CreateCouplePlaceholder} />
      <Stack.Screen name="JoinCouple" component={JoinCouplePlaceholder} />
    </Stack.Navigator>
  );
}