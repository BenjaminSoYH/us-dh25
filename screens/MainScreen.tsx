import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import ProgressBar from "../components/ProgressBar";
import Navbar from "../components/Navbar";

type Props = NativeStackScreenProps<RootStackParamList, 'MainScreen'>;

export default function MainScreen({ route }: Props) {
    const name = route.params?.name ?? 'Guest';

    const getGreeting = () => {
        const currentHour = new Date().getHours();
        if (currentHour < 12) return "Good Morning";
        if (currentHour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    // preload tulip images
    const tulipImages = [
        require('../assets/tulip/Tulip1.png'),
        require('../assets/tulip/Tulip2.png'),
        require('../assets/tulip/Tulip3.png'),
        require('../assets/tulip/Tulip4.png'),
        require('../assets/tulip/Tulip5.png'),
        require('../assets/tulip/Tulip6.png'),
        require('../assets/tulip/Tulip7.png'),
        require('../assets/tulip/Tulip8.png'),
        require('../assets/tulip/Tulip9.png'),
        require('../assets/tulip/Tulip10.png'),
    ];

    const getTulipStage = (xp: number) => {
        const clampedXP = Math.min(Math.max(xp, 0), 100);
        const stage = Math.ceil((clampedXP / 100) * 10);
        return stage === 0 ? 1 : stage; // return 1–10
    };

    const xp = 50;
    const stageIndex = getTulipStage(xp) - 1;

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1200,       // 1.2s fade
            useNativeDriver: true // smoother GPU-driven animation
        }).start();
    }, []);

    return (
        <View style={styles.screen}>
            <View style={styles.content}>
                <View style={{ width: "100%" }}>
                    <Text style={styles.greetingText}>{getGreeting()}, {name}!</Text>
                </View>

                <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 120 }}>
                    <Animated.Image
                        style={{ width: 300, height: 300, opacity: fadeAnim }}
                        source={tulipImages[stageIndex]}
                        resizeMode="contain"
                    />

                    <View style={{ marginTop: 30, width: "100%" }}>
                        <ProgressBar progress={xp}/>
                        <View style={styles.progressLabels}>
                            <Text style={styles.percentText}>0%</Text>
                            <Text style={styles.percentText}>100%</Text>
                        </View>
                    </View>
                </View>
            </View>
            <Navbar />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        paddingHorizontal: 30,
        backgroundColor: 'white',
        paddingBottom: 90,
        alignItems: "center", // Centers everything
    },

    content: {
        flex: 1,
        paddingVertical: 80,
    },

    greetingText: {
        fontSize: 35,
        fontWeight: "bold",
        marginTop: 40,
    },

    progressLabels: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
    },

    percentText: {
        fontWeight: "bold",
        fontSize: 20,
    },
});
