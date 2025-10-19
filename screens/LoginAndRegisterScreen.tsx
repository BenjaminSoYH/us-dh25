import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SignInScreen() {
  const navigation = useNavigation<any>(); // we'll type this later when we add the Auth stack
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return false;
    }
    // Extremely light email check for now
    if (!email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email.');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password should be at least 6 characters.');
      return false;
    }
    if (mode === 'signup' && password !== confirm) {
      Alert.alert('Passwords do not match', 'Please confirm your password.');
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;

    // UI-only for now — pretend to auth and move on
    try {
      setLoading(true);
      // simulate a short network request
      setTimeout(() => {
        setLoading(false);
        // after auth success, go to the pairing flow:
        navigation.navigate('CoupleGate'); // make sure we add this screen to the nav next
      }, 600);
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.appName}>Bloom</Text>
            <Text style={styles.tagline}>Grow together, one day at a time.</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setMode('signin')}
                style={[styles.toggleBtn, mode === 'signin' && styles.toggleActive]}
                disabled={mode === 'signin'}
              >
                <Text style={[styles.toggleText, mode === 'signin' && styles.toggleTextActive]}>
                  Log in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('signup')}
                style={[styles.toggleBtn, mode === 'signup' && styles.toggleActive]}
                disabled={mode === 'signup'}
              >
                <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>
                  Create account
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {mode === 'signup' && (
              <View style={styles.field}>
                <Text style={styles.label}>Confirm password</Text>
                <TextInput
                  style={styles.input}
                  secureTextEntry
                  placeholder="••••••••"
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator /> : (
                <Text style={styles.primaryText}>
                  {mode === 'signin' ? 'Log in' : 'Create account'}
                </Text>
              )}
            </TouchableOpacity>

            {mode === 'signin' && (
              <TouchableOpacity onPress={() => Alert.alert('Reset password', 'Coming soon!')}>
                <Text style={styles.link}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footerNote}>
            <Text style={styles.noteText}>
              By continuing, you agree to our Terms and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' }, // slate-900 vibe
  scroll: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  header: { marginBottom: 28, alignItems: 'center' },
  appName: { fontSize: 42, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
  tagline: { marginTop: 6, fontSize: 14, color: '#cbd5e1' },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: 'white' },
  toggleText: { fontWeight: '600', color: '#64748b' },
  toggleTextActive: { color: '#111827' },
  field: { marginVertical: 8 },
  label: { fontSize: 13, color: '#334155', marginBottom: 6, fontWeight: '600' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  primaryBtn: {
    marginTop: 14,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  primaryText: { color: 'white', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', marginTop: 12, color: '#2563eb', fontWeight: '600' },
  footerNote: { marginTop: 16, alignItems: 'center' },
  noteText: { color: '#94a3b8', fontSize: 12, textAlign: 'center' },
});