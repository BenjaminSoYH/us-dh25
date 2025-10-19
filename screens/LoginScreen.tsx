import React, { useState } from 'react'
import { StyleSheet, View, Image, Text, TouchableOpacity, Alert } from "react-native";
import LoginInput from "../components/LoginInput";
import ButtonComponent from "../components/ButtonComponent";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeftIcon } from "react-native-heroicons/solid";
import { supabase } from '../lib/supabase'
import { upsertProfile } from '../lib/db'

const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Define a method that handleSubmit
    const handleSubmit = async () => {
        if (!validate()) return;  // Added: Call validate and exit if it fails

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                Alert.alert('Error', error.message)
                return
            }
            try {
                const user = (await supabase.auth.getUser()).data.user
                await upsertProfile({ handle: user?.id })
            } catch { }
            Alert.alert('Success', 'Login successful!');
            navigation.navigate('MainScreen');
            // navigation.navigate('Home'); // Navigate to home or next screen
        } catch (e: any) {
            Alert.alert('Error', String(e?.message ?? e))
        }
    };

    const validate = () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing info', 'Please enter your email and password.');
            return false;
        }
        if (!email.includes('@')) {
            Alert.alert('Invalid email', 'Please enter a valid email.');
            return false;
        }
        if (password.length < 6) {
            Alert.alert('Weak password', 'Password should be at least 6 characters.');
            return false;
        }
        return true;
    }

    return (
        <View style={styles.screen}>
            <View style={styles.content}>
                <View style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <Image
                        style={{ width: 150, height: 150 }}
                        source={require('../assets/BloomLogo.png')}
                        resizeMode="contain"
                    />
                    <Text style={{ fontWeight: "bold", fontSize: 20 }}>Sign in</Text>
                    <Text style={{ fontSize: 20, color: "#777777" }}>Sign in to your account via email</Text>
                </View>
                <View style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                    <LoginInput placeHolder={"Enter your email"} onChange={(email: string) => { setEmail(email) }} />
                    <LoginInput placeHolder={"Enter your password"} onChange={(password: string) => { setPassword(password) }} />
                </View>
                <ButtonComponent title={"Sign in"} mainColor="FF8781" textColor="FFFFFF" onPress={handleSubmit} />
                <View style={{ width: "100%", display: "flex", flexDirection: "row", justifyContent: "flex-end" }}>
                    <TouchableOpacity style={{ display: "flex", flexDirection: "row", gap: 10, alignItems: "center" }} onPress={() => { navigation.navigate('SplashScreen') }}>
                        <ArrowLeftIcon></ArrowLeftIcon>
                        <Text>Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        paddingVertical: 100,
        paddingHorizontal: 30,
        alignItems: "center",
        justifyContent: "center",  // Centers everything
        backgroundColor: 'white'
    },

    content: {
        width: "100%",
        gap: 20,  // Space between logo and buttons
        alignItems: "center"
    },

});

export default LoginScreen;
