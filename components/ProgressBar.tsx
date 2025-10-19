import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface ProgressBarProps {
    progress: number; // 0 to 100
    height?: number;
    backgroundColor?: string;
    progressColor?: string;
    showPercentage?: boolean;
    animated?: boolean;
}

const ProgressBar = ({
                         progress,
                         height = 12,
                         backgroundColor = '#E6EAEF',
                         progressColor = '#FF8781',
                         showPercentage = false,
                         animated = true,
                     }: ProgressBarProps) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <View style={styles.container}>
            <View
                style={[
                    styles.track,
                    {
                        height,
                        backgroundColor,
                        borderRadius: height / 2, // Makes it fully rounded
                    },
                ]}
            >
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${clampedProgress}%`,
                            height,
                            backgroundColor: progressColor,
                            borderRadius: height / 2, // Makes it fully rounded
                        },
                        animated && styles.animated,
                    ]}
                />
            </View>
            {showPercentage && (
                <Text style={styles.percentageText}>{clampedProgress}%</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    track: {
        flex: 1,
        overflow: 'hidden', // Important for rounded corners
    },
    fill: {
        height: '100%',
    },
    animated: {
        // Add transition if using Animated API
    },
    percentageText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        minWidth: 40,
    },
});

export default ProgressBar;