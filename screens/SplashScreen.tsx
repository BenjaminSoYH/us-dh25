import React from 'react'
import {StyleSheet, View, Image, Text} from "react-native";
import ButtonComponent from "../components/ButtonComponent";


const SplashScreen = () => {
    const signInPress = () => {

    };
    const signUpPress = () => {

    };

    return (
        <View style={styles.screen}>
            <View style={styles.content}>
                <View style={styles.logo}>
                    <Image
                        style={{width: 150, height: 150}}
                        source={require('../assets/BloomLogo.png')}
                        resizeMode="contain"
                    />
                    <View style={styles.textContainer}>
                        <Text style={[styles.logoText, {fontSize: 50, fontFamily: 'AbhayaLibre-ExtraBold'}]}>
                            Bloom
                        </Text>
                        <Text style={[styles.logoText, {fontSize: 25}]}>
                            Answer. Grow. Together
                        </Text>
                    </View>
                </View>

                <View style={styles.buttons}>
                    <ButtonComponent title="Sign in" mainColor="FFFFFF" textColor="000000" />
                    <ButtonComponent title="Get started" mainColor="FF8781" textColor="FFFFFF" />
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        paddingVertical: 100,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center"  // Centers everything
    },
    content: {
        width: "100%",
        gap: 40,  // Space between logo and buttons
        alignItems: "center"
    },
    logo: {
        gap: 10,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
    },
    textContainer: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
    },
    buttons: {
        flexDirection: "column",
        gap: 10,
        width: "100%"
    },
    logoText: {
        color: "#FF8781"
    },
});

export default SplashScreen;