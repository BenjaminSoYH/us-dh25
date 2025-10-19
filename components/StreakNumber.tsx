import React, { useEffect, useRef } from 'react';
import { Animated, View, Text as RNText } from 'react-native';

type StreakNumberProps = {
  value: number;
  fontSize?: number;
  fireFontSize?: number;
};

export default function StreakNumber({ value, fontSize = 36, fireFontSize = 48 }: StreakNumberProps) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (value > 5) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [value, pulse]);

  const fireScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.25] });
  const fireOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {value > 5 && (
        <Animated.View style={{ position: 'absolute', alignItems: 'center', transform: [{ scale: fireScale }], opacity: fireOpacity }}>
          <RNText style={{ fontSize: fireFontSize, textAlign: 'center' }}>🔥</RNText>
        </Animated.View>
      )}
      <RNText style={{ fontSize, fontWeight: '700', color: '#111' }}>{value}</RNText>
    </View>
  );
}
