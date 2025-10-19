import React, { useState } from 'react';
import { View, Text, Button, TouchableOpacity, StyleSheet } from 'react-native';
import HeartBox from '../components/HeartBox';
import StreakNumber from '../components/StreakNumber';

export default function HomeScreen({ navigation, route }: any) {
  const [percentage, setPercentage] = useState(50);
  const [count, setCount] = useState(0);
  const name = route?.params?.name ?? 'Guest';

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>hellom {name}...</Text>
      <Text style={styles.title}>Home Screen</Text>

      <StreakNumber value={6} fontSize={30} fireFontSize={64} />

    <HeartBox width={500} height={500} percentage={percentage} value={count} />

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setPercentage((p) => Math.max(0, p - 5))}
        >
          <Text style={styles.controlText}>-5%</Text>
        </TouchableOpacity>

        <Text style={styles.percText}>{percentage}%</Text>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setPercentage((p) => Math.min(100, p + 5))}
        >
          <Text style={styles.controlText}>+5%</Text>
        </TouchableOpacity>
      </View>


      <Button title="Go to Details" onPress={() => navigation.navigate('Details')} />
      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <TouchableOpacity style={[styles.controlButton, { marginRight: 10 }]} onPress={() => setCount((c) => Math.max(0, c - 1))}>
          <Text style={styles.controlText}>-</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setCount((c) => c + 1)}>
          <Text style={styles.controlText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, marginBottom: 12 },
  greeting: { fontSize: 18, marginBottom: 6, color: '#333' },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 20 },
  controlButton: { backgroundColor: '#eee', padding: 10, borderRadius: 6 },
  controlText: { fontSize: 16 },
  percText: { marginHorizontal: 12, fontSize: 16 },
});
