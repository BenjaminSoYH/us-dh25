import React from 'react'
import {StyleSheet, View, Image, Text} from "react-native";
import ButtonComponent from "../components/ButtonComponent";
import {useNavigation} from "@react-navigation/native";


const SplashScreen = () => {
    const navigation = useNavigation<any>();

    const signInPress = () => {
        navigation.navigate('LoginScreen');

    };
    const signUpPress = () => {
        navigation.navigate('SignUpScreen');

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
                    <ButtonComponent title="Sign in" mainColor="FFFFFF" textColor="000000" onPress={signInPress}/>
                    <ButtonComponent title="Get started" mainColor="FF8781" textColor="FFFFFF" onPress={signUpPress} />
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
        justifyContent: "center", // Centers everything
        backgroundColor: "white"
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