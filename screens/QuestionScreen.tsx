import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { getTodayQuestion, getAnswersForQuestion, upsertMyAnswer } from "../lib/db";
import { supabase } from "../lib/supabase";
import Navbar from '../components/Navbar';

export default function QuestionScreen({ questionText = undefined as string | undefined }) {
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [question, setQuestion] = useState<null | { id: string; text: string }>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [{ data: { user } }, q] = await Promise.all([
          supabase.auth.getUser(),
          getTodayQuestion()
        ]);
        if (!mounted) return;
        setMyUserId(user?.id ?? null);
        if (!q) {
          setQuestion(null);
          setMyAnswer(null);
          setPartnerAnswer(null);
          return;
        }
        setQuestion({ id: q.id, text: questionText ?? q.text });
        const answers = await getAnswersForQuestion(q.id);
        if (!mounted) return;
        const mine = answers.find(a => a.user_id === user?.id);
        const theirs = answers.find(a => a.user_id !== user?.id);
        setMyAnswer(mine?.content ?? null);
        setPartnerAnswer(theirs?.content ?? null);
        if (mine?.content) setText(mine.content);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [questionText]);

  const canSubmit = (text.trim().length > 0) && !!question && !!myUserId;
  const showPartner = !!myAnswer; // only after I've answered

  const onSubmit = async () => {
    if (!canSubmit || !question) return;
    try {
      setSubmitting(true);
      await upsertMyAnswer(question.id, text.trim());
      setMyAnswer(text.trim());
      // Refresh partner answer after my submission
      const answers = await getAnswersForQuestion(question.id);
      const theirs = answers.find(a => a.user_id !== myUserId);
      setPartnerAnswer(theirs?.content ?? null);
      Alert.alert('Submitted', 'Thanks for sharing your honest thoughts.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsFocused(false); }} accessible={false}>
      <View style={styles.screen}>
        <Text style={styles.titleText}>Daily Question</Text>
        <Text style={styles.captionText}>honest thoughts only :)</Text>
        {loading ? (
          <ActivityIndicator color={colors.peach} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : !question ? (
          <View style={styles.card}>
            <Text style={styles.questionText}>No question today. Check back tomorrow!</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.questionText}>{question.text}</Text>
            </View>
            <TextInput
              value={text}
              onChangeText={setText}
              style={[
                styles.inputBox,
                { borderColor: isFocused ? '#95B88F' : '#CCCCCC' },
              ]}
              placeholder="Write your response here..."
              placeholderTextColor="#AAAAAA"
              multiline
              numberOfLines={3}
              scrollEnabled
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              textAlignVertical="top"
              underlineColorAndroid="transparent"
              editable={!submitting}
            />
            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              disabled={!canSubmit || submitting}
              onPress={onSubmit}
              accessibilityState={{ disabled: !canSubmit || submitting }}
            >
              <Text style={styles.submitButtonText}>{submitting ? 'Submitting…' : (myAnswer ? 'Update' : 'Submit')}</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
            <Text style={[styles.captionText, { marginBottom: 8 }]}>Partner's Answer</Text>
            {!showPartner ? (
              <Text style={styles.partnerHint}>Answer first to reveal your partner's response.</Text>
            ) : partnerAnswer ? (
              <ScrollView style={styles.partnerAnswerBox}>
                <Text style={styles.partnerAnswerText}>{partnerAnswer}</Text>
              </ScrollView>
            ) : (
              <Text style={styles.partnerHint}>Your partner hasn't answered yet.</Text>
            )}
          </>
        )}
        <Navbar />
      </View>
    </TouchableWithoutFeedback>
  );
}

// Base styles + color tokens to match your Splash screen vibe
const colors = {
  peach: '#FF8781', // primary accent
  peachLight: '#FFE1DF',
  textDark: '#333333',
  white: '#FFFFFF',
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 90,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    minHeight: 180,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.peachLight,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 50,
    color: colors.peach,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'AbhayaLibre-ExtraBold',
  },
  captionText: {
    fontSize: 25,
    color: colors.peach,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'AbhayaLibre-ExtraBold',
  },
  questionText: {
    fontSize: 25,
    color: colors.textDark,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 20,
    fontFamily: 'AbhayaLibre-ExtraBold',
  },
  inputBox: {
    alignSelf: 'stretch',
    height: 100, // ~3 lines with padding for 18/24 line height
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    lineHeight: 22,
    marginTop: 20,
    marginBottom: 15,
    fontFamily: 'AbhayaLibre-ExtraBold',
    fontSize: 18,
    color: colors.textDark,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.peach,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'AbhayaLibre-ExtraBold',
    textAlign: 'center',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: 'AbhayaLibre-ExtraBold',
  },
  partnerHint: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    fontFamily: 'AbhayaLibre-ExtraBold',
  },
  partnerAnswerBox: {
    alignSelf: 'stretch',
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.peachLight,
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFF8F8',
  },
  partnerAnswerText: {
    fontSize: 18,
    color: colors.textDark,
    fontFamily: 'AbhayaLibre-ExtraBold',
  },
});
