import React from 'react'
import {Image, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import LoginInput from "../components/LoginInput";
import ButtonComponent from "../components/ButtonComponent";
import {ArrowLeftIcon} from "react-native-heroicons/solid";
import {useNavigation} from "@react-navigation/native";

const SignUpScreen = () => {
    const navigation = useNavigation<any>();
    return (
        <View style={styles.screen}>
            <View style={styles.content}>
                <View style={{display:"flex", flexDirection:"column", alignItems:"center", gap: 5}}>
                    <Image
                        style={{width: 150, height: 150}}
                        source={require('../assets/BloomLogo.png')}
                        resizeMode="contain"
                    />
                    <Text style={{fontWeight:"bold", fontSize: 20}}>Sign up</Text>
                    <Text style={{fontSize: 20, color: "#777777"}}>Sign in to your account via email</Text>
                </View>
                <View style={{width: "100%", display:"flex", flexDirection:"column", gap: 10}}>
                    <LoginInput placeHolder={"Enter your email"} onChange={undefined}  />
                    <LoginInput placeHolder={"Enter your password"} onChange={undefined}/>
                </View>
                <ButtonComponent title={"Sign in"} mainColor="FF8781" textColor="FFFFFF" onPress={undefined}/>
                <View style={{width:"100%", display:"flex", flexDirection:"row", justifyContent:"flex-end"}}>
                    <TouchableOpacity style={{display:"flex", flexDirection:"row", gap: 10, alignItems:"center"}} onPress={() => {navigation.navigate('SplashScreen')}}>
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