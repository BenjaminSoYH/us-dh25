import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MainScreen'>;

export default function MainScreen({ route }: Props) {
    const name = route.params?.name ?? 'Guest';

    return (
        <View style={styles.screen}>
            <View style={styles.content}>
                <Text>Hello, {name}!</Text>

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