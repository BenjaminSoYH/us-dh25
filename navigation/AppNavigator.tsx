// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignInScreen from '../screens/LoginAndRegisterScreen';
import CoupleGateScreen from '../screens/CoupleGateScreen';
import HomeScreen from '../screens/HomeScreen';
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import QuestionScreen from '../screens/QuestionScreen';

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
  CoupleGate: undefined;
  CreateCouple: undefined;
  JoinCouple: undefined;
  LoginScreen: undefined;
  SignUpScreen: undefined;
  QuestionScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="SplashScreen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen}/>
        <Stack.Screen name="SignUpScreen" component={SignUpScreen}/>
        <Stack.Screen name="QuestionScreen" component={QuestionScreen} />
      {/*<Stack.Screen name="SignIn" component={SignInScreen} />*/}
      {/*<Stack.Screen name="Home" component={HomeScreen} />*/}
      {/*<Stack.Screen name="CoupleGate" component={CoupleGateScreen} />*/}
      {/*<Stack.Screen name="CreateCouple" component={CreateCouplePlaceholder} />*/}
      {/*<Stack.Screen name="JoinCouple" component={JoinCouplePlaceholder} />*/}
    </Stack.Navigator>
  );
}