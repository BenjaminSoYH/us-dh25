import React, { useState } from 'react'
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LoginInput from "../components/LoginInput";
import ButtonComponent from "../components/ButtonComponent";
import { ArrowLeftIcon } from "react-native-heroicons/solid";
import { useNavigation } from "@react-navigation/native";
import { supabase } from '../lib/supabase'
import { upsertProfile } from '../lib/db'

const SignUpScreen = () => {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);


    async function signInWithEmail() {
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })

        if (!error) {
            try {
                const user = (await supabase.auth.getUser()).data.user
                await upsertProfile({ handle: user?.id })
            } catch { }
        } else {
            Alert.alert(error.message)
        }
        setLoading(false)
    }

    async function signUpWithEmail() {
        setLoading(true)
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
        })

        if (!error && session) {
            try {
                const user = (await supabase.auth.getUser()).data.user
                await upsertProfile({ handle: user?.id })
            } catch { }
        }
        if (error) Alert.alert(error.message)
        if (!session) Alert.alert('Please check your inbox for email verification!')
        setLoading(false)
    }

    const handleSubmit = async () => {
        if (loading) return;
        if (!validate()) return;  // Added: Call validate and exit if it fails
        await signUpWithEmail();
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

        if (password !== confirm) {
            Alert.alert('Passwords do not match', 'Please confirm your password.');
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
                    <Text style={{ fontWeight: "bold", fontSize: 30 }}>Sign up</Text>
                </View>
                <View style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                    <LoginInput placeHolder={"Enter your email"} onChange={(email: string) => { setEmail(email) }} />
                    <LoginInput placeHolder={"Enter your password"} onChange={(password: string) => { setPassword(password) }} />
                    <LoginInput placeHolder={"Confirm your password"} onChange={(confirm: string) => { setConfirm(confirm) }} />
                </View>

                <ButtonComponent title={"Sign up"} mainColor="FF8781" textColor="FFFFFF" onPress={() => { handleSubmit() }} />
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


export default SignUpScreen
