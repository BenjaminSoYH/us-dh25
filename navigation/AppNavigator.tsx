// navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import QuestionScreen from '../screens/QuestionScreen';
import PairingScreen from '../screens/PairingScreen';
import MainScreen from "../screens/MainScreen";

const CreateCouplePlaceholder = () => <></>;
const JoinCouplePlaceholder = () => <></>;

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
    PairingScreen: undefined;
    // Pass the user's name as a route param
    MainScreen: { name: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <Stack.Navigator initialRouteName="SplashScreen" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SplashScreen" component={SplashScreen} />
            <Stack.Screen name="LoginScreen" component={LoginScreen}/>
            <Stack.Screen name="SignUpScreen" component={SignUpScreen}/>
            <Stack.Screen name="QuestionScreen" component={QuestionScreen} />
            <Stack.Screen name="PairingScreen" component={PairingScreen} />
            {/* Provide an optional default with initialParams if desired */}
            <Stack.Screen
                name="MainScreen"
                component={MainScreen}
                initialParams={{ name: 'Guest' }}
            />
        </Stack.Navigator>
    );
}