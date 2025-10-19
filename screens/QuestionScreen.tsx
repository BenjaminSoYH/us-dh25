import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';

export default function QuestionScreen({ questionText = 'What assumption did you make about me that turned out to be false?' }) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(80);
  const [text, setText] = useState('');

  const canSubmit = text.trim().length > 0;
  const handleSubmit = () => {
    if (!canSubmit) return; // guard
    Alert.alert('Submitted', 'Thanks for sharing your honest thoughts.');
  };


  return (
    <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setIsFocused(false); }} accessible={false}>
      <View style={styles.screen}>
        <Text style={styles.titleText}>Daily Question</Text>
        <Text style={styles.captionText}>honest thoughts only :)</Text>
        <View style={styles.card}>
          <Text style={styles.questionText}>{questionText}</Text>
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
        />
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
          accessibilityState={{ disabled: !canSubmit }}
        >
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
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
});