import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

export default function PairingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'PairingScreen'>>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Start together</Text>
          <Text style={styles.subtitle}>
            Pair with your partner to begin your daily questions and shared streak.
          </Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.primaryBtn, { marginBottom: 12 }]}
            onPress={() => navigation.navigate('CreateCouple')}
          >
            <Text style={styles.primaryText}>Create couple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('JoinCouple')}
          >
            <Text style={styles.secondaryText}>Join with code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You’ll only start counting a streak once both of you answer each day.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { marginBottom: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
    borderColor:'#111827',
  },
  primaryBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8781',
  },
  primaryText: { color: 'white', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#95B88F',
  },
  secondaryText: { color: 'white', fontWeight: '700', fontSize: 16 },
  footer: { marginTop: 18, alignItems: 'center', paddingHorizontal: 8 },
  footerText: { color: '#111827', fontSize: 12, textAlign: 'center' },
});
