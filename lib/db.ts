// Client-side DB helpers wrapping Supabase calls
// These expect an authenticated user; RLS enforces privacy rules.
import { supabase } from "./supabase";
import { z } from "zod";
import { ZNewAnswer, ZNewJournal, ZNewPostFinalize, ZCoupleRequest, ZSendCoupleRequest, ZQuestion, ZJournal, ZJournalSummary, ZAnswer } from "../models";

// Upsert my profile row using auth.uid()
export async function upsertProfile({ handle, display_name, avatar_url }: { handle?: string; display_name?: string; avatar_url?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    // Default handle to the authenticated user UUID to guarantee uniqueness and linkage
    const effectiveHandle = handle ?? user.id;
    const { data, error } = await supabase
        .from("users")
        .upsert({ id: user.id, handle: effectiveHandle, display_name, avatar_url })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Resolve my couple_id via membership
export async function myCoupleId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("couple_members").select("couple_id").eq("user_id", user.id).single();
    return data?.couple_id ?? null;
}

// Create a prompt in my couple (kind: question|photo)
export async function createPrompt(kind: "question" | "photo", scheduled_at: string, expires_at?: string) {
    const couple_id = await myCoupleId();
    if (!couple_id) throw new Error("No couple");
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
        .from("prompts")
        .insert({ couple_id, kind, scheduled_at, expires_at, created_by: user!.id })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Attach a question to a prompt (for question prompts)
export async function addQuestion(prompt_id: string, text: string, model_source?: string) {
    const { data, error } = await supabase.from("questions").insert({ prompt_id, text, model_source }).select().single();
    if (error) throw error;
    return data;
}

// Answer a question; owner inferred from auth
export async function answerQuestion(payload: z.infer<typeof ZNewAnswer>) {
    const parsed = ZNewAnswer.parse(payload);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("answers").insert({ ...parsed, user_id: user!.id }).select().single();
    if (error) throw error;
    return data;
}

// Create a journal entry; visibility defaults to private
export async function newJournal(payload: z.infer<typeof ZNewJournal>) {
    const parsed = ZNewJournal.parse(payload);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("journals").insert({ ...parsed, user_id: user!.id }).select().single();
    if (error) throw error;
    return ZJournal.parse(data);
}

export async function listMyJournals() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((j) => ZJournal.parse(j));
}

export async function getJournal(journal_id: string) {
    const { data, error } = await supabase.from('journals').select('*').eq('id', journal_id).single();
    if (error) throw error;
    return ZJournal.parse(data);
}

export async function updateJournal(journal_id: string, changes: Partial<Pick<z.infer<typeof ZNewJournal>, 'title' | 'content' | 'visibility'>>) {
    const { data, error } = await supabase
        .from('journals')
        .update(changes)
        .eq('id', journal_id)
        .select()
        .single();
    if (error) throw error;
    return ZJournal.parse(data);
}

export async function deleteJournal(journal_id: string) {
    const { error } = await supabase.from('journals').delete().eq('id', journal_id);
    if (error) throw error;
}

export async function listJournalSummaries(journal_id: string) {
    const { data, error } = await supabase
        .from('journal_summaries')
        .select('*')
        .eq('journal_id', journal_id)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((s) => ZJournalSummary.parse(s));
}

// Trigger OpenAI summarization via Edge Function
export async function summarizeJournal(journal_id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${process.env.EXPO_PUBLIC_EDGE_URL}/journal-summarize`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ kind: 'journal_summary', journal_id })
    });
    if (!res.ok) throw new Error(`Summarize failed: ${res.status}`);
    return res.json();
}

// Ask server to finalize stitched photo and insert post (Edge Function)
export async function finalizeDualPhoto(payload: z.infer<typeof ZNewPostFinalize>) {
    const parsed = ZNewPostFinalize.parse(payload);
    const res = await fetch(`${process.env.EXPO_PUBLIC_EDGE_URL}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
    });
    if (!res.ok) throw new Error(`Finalize failed: ${res.status}`);
    return res.json();
}


// Couple Requests
export async function sendCoupleRequest(payload: z.infer<typeof ZSendCoupleRequest>) {
    const parsed = ZSendCoupleRequest.parse(payload);
    const { data, error } = await supabase.rpc('send_couple_request', { recipient_handle: parsed.recipient_handle, msg: parsed.message });
    if (error) throw error;
    return ZCoupleRequest.parse(data);
}

export async function listMyCoupleRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
        .from('couple_requests')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) throw error;
    const parsed = (data ?? []).map((r) => ZCoupleRequest.parse(r));
    return {
        incoming: parsed.filter((r) => r.recipient_id === user.id && r.status === 'pending'),
        outgoing: parsed.filter((r) => r.requester_id === user.id && r.status === 'pending'),
        history: parsed
    };
}

export async function acceptCoupleRequest(request_id: string) {
    const { data, error } = await supabase.rpc('accept_couple_request', { request_id });
    if (error) throw error;
    return data as string; // couple_id
}

export async function declineCoupleRequest(request_id: string) {
    const { error } = await supabase.rpc('decline_couple_request', { request_id });
    if (error) throw error;
}

export async function cancelCoupleRequest(request_id: string) {
    const { error } = await supabase.rpc('cancel_couple_request', { request_id });
    if (error) throw error;
}

// Daily Questions (promptless)
export async function addDailyQuestion(text: string, scheduled_for: string) {
    const couple_id = await myCoupleId();
    if (!couple_id) throw new Error("No couple");
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
        .from('questions')
        .insert({ couple_id, scheduled_for, text, created_by: user!.id })
        .select()
        .single();
    if (error) throw error;
    return ZQuestion.parse(data);
}

export async function getTodayQuestion() {
    const couple_id = await myCoupleId();
    if (!couple_id) throw new Error("No couple");
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('couple_id', couple_id)
        .eq('scheduled_for', new Date().toISOString().slice(0, 10))
        .maybeSingle();
    if (error) throw error;
    return data ? ZQuestion.parse(data) : null;
}



// Answers helpers
export async function getAnswersForQuestion(question_id: string) {
    const { data, error } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', question_id)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((a) => ZAnswer.parse(a));
}

export async function upsertMyAnswer(question_id: string, content: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
        .from('answers')
        .upsert({ question_id, user_id: user.id, content }, { onConflict: 'question_id,user_id' })
        .select()
        .single();
    if (error) throw error;
    return ZAnswer.parse(data);
}
