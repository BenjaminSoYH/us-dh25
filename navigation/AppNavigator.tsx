// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import QuestionScreen from '../screens/QuestionScreen';
import PairingScreen from '../screens/PairingScreen';

const CreateCouplePlaceholder = () => (
  <></>
);
const JoinCouplePlaceholder = () => (
  <></>
);

export type RootStackParamList = {
  SplashScreen: undefined;
  SignIn: undefined;
  Home: undefined;
  CreateCouple: undefined;
  JoinCouple: undefined;
  LoginScreen: undefined;
  SignUpScreen: undefined;
  QuestionScreen: undefined;
  PairingScreen: undefined;
  HomeScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="SignUpScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen}/>
      <Stack.Screen name="SignUpScreen" component={SignUpScreen}/>
      <Stack.Screen name="QuestionScreen" component={QuestionScreen} />
      <Stack.Screen name="PairingScreen" component={PairingScreen} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
    </Stack.Navigator>
  );
}