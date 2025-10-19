import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { listMyJournals, newJournal, updateJournal, summarizeJournal, listJournalSummaries } from '../lib/db';

type Journal = {
  id: string;
  title?: string | null;
  content: string;
  visibility: 'private' | 'partner';
  created_at: string;
  updated_at: string;
  ai_summary?: string | null;
}

export default function JournalScreen() {
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [items, setItems] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<Journal | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'partner'>('private');
  const [summaries, setSummaries] = useState<{ summary: string; created_at: string }[]>([]);
  const [summarizing, setSummarizing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const list = await listMyJournals();
      setItems(list as any);
    } catch (e) {
      Alert.alert('Error', 'Failed to load journals');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setCurrent(null);
    setTitle('');
    setContent('');
    setVisibility('private');
    setSummaries([]);
    setMode('edit');
  }

  async function openEdit(j: Journal) {
    setCurrent(j);
    setTitle(j.title ?? '');
    setContent(j.content);
    setVisibility(j.visibility);
    setMode('edit');
    try {
      const hist = await listJournalSummaries(j.id);
      setSummaries(hist.map(h => ({ summary: (h as any).summary, created_at: (h as any).created_at })));
    } catch { }
  }

  async function save() {
    if (!content.trim()) {
      Alert.alert('Empty', 'Write something first.');
      return;
    }
    setSaving(true);
    try {
      if (current) {
        await updateJournal(current.id, { title: title || null, content, visibility });
      } else {
        await newJournal({ title: title || null, content, visibility });
      }
      await load();
      setMode('list');
    } catch (e) {
      Alert.alert('Error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function doSummarize() {
    if (!current) return;
    setSummarizing(true);
    try {
      await summarizeJournal(current.id);
      await load();
      const hist = await listJournalSummaries(current.id);
      setSummaries(hist.map(h => ({ summary: (h as any).summary, created_at: (h as any).created_at })));
    } catch (e) {
      Alert.alert('Error', 'Failed to summarize');
    } finally {
      setSummarizing(false);
    }
  }

  const header = useMemo(() => (
    <View style={styles.header}>
      <Text style={styles.title}>Journal</Text>
      {mode === 'list' && (
        <TouchableOpacity style={styles.newBtn} onPress={openNew}>
          <Text style={styles.newText}>New</Text>
        </TouchableOpacity>
      )}
    </View>
  ), [mode]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  if (mode === 'list') {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        {header}
        <Text style={styles.notice}>
          Your entries can be optionally summarized and shared with your partner to help them understand you better.
        </Text>
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
              <Text style={styles.cardTitle}>{item.title || 'Untitled'}</Text>
              <Text numberOfLines={2} style={styles.cardBody}>{item.content}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>Created {new Date(item.created_at).toLocaleDateString()}</Text>
                <Text style={styles.meta}>Updated {new Date(item.updated_at).toLocaleDateString()}</Text>
                <Text style={styles.meta}>{item.visibility === 'partner' ? 'Shared' : 'Private'}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No entries yet. Tap New to start.</Text>}
        />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={{ flex: 1, padding: 16 }}>
        {header}
        <View style={styles.editRow}>
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TouchableOpacity
            style={[styles.toggle, visibility === 'partner' && styles.toggleActive]}
            onPress={() => setVisibility(v => (v === 'partner' ? 'private' : 'partner'))}
          >
            <Text style={styles.toggleText}>{visibility === 'partner' ? 'Shared' : 'Private'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          placeholder="Write your thoughts..."
          value={content}
          onChangeText={setContent}
          style={styles.textarea}
          multiline
        />
        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveText}>Save</Text>}
          </TouchableOpacity>
          {current && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={doSummarize} disabled={summarizing}>
              {summarizing ? <ActivityIndicator /> : <Text style={styles.secondaryText}>Summarize</Text>}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setMode('list')}>
            <Text style={styles.secondaryText}>Back</Text>
          </TouchableOpacity>
        </View>

        {current && (current.ai_summary ? (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Latest Summary</Text>
            <Text style={styles.summaryText}>{current.ai_summary}</Text>
          </View>
        ) : null)}

        {summaries.length > 0 && (
          <View style={styles.historyBox}>
            <Text style={styles.historyTitle}>Summary History</Text>
            {summaries.map((s, idx) => (
              <View key={idx} style={{ marginBottom: 10 }}>
                <Text style={styles.meta}>{new Date(s.created_at).toLocaleString()}</Text>
                <Text style={styles.summaryText}>{s.summary}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  newBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', borderRadius: 8 },
  newText: { color: 'white', fontWeight: '700' },
  notice: { color: '#475569', marginBottom: 12 },
  card: { padding: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, marginBottom: 10 },
  cardTitle: { fontWeight: '700', marginBottom: 6 },
  cardBody: { color: '#334155' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  meta: { color: '#64748b', fontSize: 12 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 30 },
  editRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 10, backgroundColor: 'white' },
  toggle: { height: 44, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  toggleActive: { backgroundColor: '#e5e7eb' },
  toggleText: { fontWeight: '600', color: '#111827' },
  textarea: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, textAlignVertical: 'top', minHeight: 200, backgroundColor: 'white' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 12 },
  saveBtn: { backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  saveText: { color: 'white', fontWeight: '700' },
  secondaryBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  secondaryText: { color: '#111827', fontWeight: '700' },
  summaryBox: { marginTop: 8, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, backgroundColor: '#f8fafc' },
  summaryTitle: { fontWeight: '700', marginBottom: 6 },
  summaryText: { color: '#1f2937' },
  historyBox: { marginTop: 16 },
  historyTitle: { fontWeight: '700', marginBottom: 6 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
