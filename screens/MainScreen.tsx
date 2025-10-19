import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ProgressBar from "../components/ProgressBar";

type Props = NativeStackScreenProps<RootStackParamList, 'MainScreen'>;

export default function MainScreen({ route }: Props) {
    const name = route.params?.name ?? 'Guest';
    const getGreeting = () => {
        const currentHour = new Date().getHours();

        if (currentHour < 12) {
            return "Good Morning";
        } else if (currentHour < 18) {
            return "Good Afternoon";
        } else {
            return "Good Evening";
        }
    };

    return (
        <View style={styles.screen}>
            <View style={styles.content}>

                <View style={{width:"100%", display: "flex", justifyContent:"flex-start"}}>
                    <Text style={{fontSize:35, fontWeight:"bold"}}>{getGreeting()}, {name}!</Text>
                    <View></View>

                    <View>
                        <ProgressBar progress={100}/>
                        <View style={{width:"100%", display:"flex", flexDirection:"row", justifyContent:"space-between"}}>
                            <Text style={{fontWeight:"bold", fontSize:20}}>0%</Text>
                            <Text style={{fontWeight:"bold", fontSize:20}}>100%</Text>
                        </View>
                    </View>
                </View>
            </View>
            {/* rest of your UI */}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        paddingVertical: 100,
        paddingHorizontal: 30,
        alignItems: "center", // Centers everything
        backgroundColor: 'white'
    },

    content: {
        width: "100%",
        gap: 20,  // Space between logo and buttons
        alignItems: "center"
    },

});