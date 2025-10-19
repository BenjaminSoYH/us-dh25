// Zod models mirroring database tables
// Purpose: type-safe inserts/reads on the client, aligned with Supabase schema
import { z } from "zod";

// Profiles (owner-only via RLS)
export const ZUser = z.object({
    id: z.string().uuid(),
    handle: z.string().min(2).max(24),
    display_name: z.string().min(1).max(64),
    avatar_url: z.string().url().optional().nullable(),
    tz: z.string().optional(),
    created_at: z.string()
});
export type User = z.infer<typeof ZUser>;

// Couples container
export const ZCouple = z.object({
    id: z.string().uuid(),
    name: z.string().optional().nullable(),
    created_at: z.string()
});
export type Couple = z.infer<typeof ZCouple>;

// Membership (user belongs to couple)
export const ZCoupleMember = z.object({
    couple_id: z.string().uuid(),
    user_id: z.string().uuid(),
    role: z.string().optional().nullable(),
    joined_at: z.string()
});
export type CoupleMember = z.infer<typeof ZCoupleMember>;

// Prompts (question or photo)
export const ZPrompt = z.object({
    id: z.string().uuid(),
    couple_id: z.string().uuid(),
    kind: z.enum(["question", "photo"]),
    scheduled_at: z.string(),
    expires_at: z.string().nullable().optional(),
    created_by: z.string().uuid().nullable().optional(),
    created_at: z.string()
});
export type Prompt = z.infer<typeof ZPrompt>;

// Questions attached to a question prompt
export const ZQuestion = z.object({
    id: z.string().uuid(),
    prompt_id: z.string().uuid().optional().nullable(),
    couple_id: z.string().uuid().optional().nullable(),
    scheduled_for: z.string().optional().nullable(),
    created_by: z.string().uuid().optional().nullable(),
    text: z.string().min(1),
    model_source: z.string().optional().nullable(),
    created_at: z.string()
});
export type Question = z.infer<typeof ZQuestion>;

// Answers (unique per question/user). Partner can read via couple membership.
export const ZAnswer = z.object({
    id: z.string().uuid(),
    question_id: z.string().uuid(),
    user_id: z.string().uuid(),
    content: z.string().min(1),
    mood: z.record(z.any()).optional().nullable(),
    created_at: z.string()
});
export type Answer = z.infer<typeof ZAnswer>;

// New answer payload validated client-side
export const ZNewAnswer = ZAnswer.pick({ question_id: true, content: true }).extend({
    user_id: z.string().uuid().optional() // server fills from auth when using edge function
});

// Journals (private by default; can be shared with partner)
export const ZJournal = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    title: z.string().optional().nullable(),
    content: z.string().min(1),
    ai_summary: z.string().optional().nullable(),
    visibility: z.enum(["private", "partner"]),
    created_at: z.string(),
    updated_at: z.string()
});
export type Journal = z.infer<typeof ZJournal>;

export const ZNewJournal = z.object({
    title: z.string().optional().nullable(),
    content: z.string().min(1),
    visibility: z.enum(["private", "partner"]).default("private")
});

// Journal summaries (append-only)
export const ZJournalSummary = z.object({
    id: z.string().uuid(),
    journal_id: z.string().uuid(),
    generated_by: z.string().uuid().optional().nullable(),
    summary: z.string().min(1),
    model: z.string().optional().nullable(),
    created_at: z.string()
});
export type JournalSummary = z.infer<typeof ZJournalSummary>;

// Final stitched post for a photo prompt
export const ZPost = z.object({
    id: z.string().uuid(),
    couple_id: z.string().uuid(),
    prompt_id: z.string().uuid(),
    user_id: z.string().uuid(),
    image_url: z.string().min(1),
    is_late: z.boolean(),
    created_at: z.string()
});
export type Post = z.infer<typeof ZPost>;

export const ZNewPostFinalize = z.object({
    prompt_id: z.string().uuid(),
    is_late: z.boolean().default(false)
    // server derives couple_id & user_id from auth/session
});

// Optional raw photos for audit/restitch
export const ZPhoto = z.object({
    id: z.string().uuid(),
    post_id: z.string().uuid(),
    kind: z.enum(["front", "back"]),
    storage_key: z.string(),
    created_at: z.string()
});
export type Photo = z.infer<typeof ZPhoto>;

// Plant XP (current state)
export const ZPlantState = z.object({
    couple_id: z.string().uuid(),
    level: z.number().int().min(1),
    xp: z.number().int().min(0),
    updated_at: z.string()
});
export type PlantState = z.infer<typeof ZPlantState>;

// XP event (append-only audit)
export const ZXpEvent = z.object({
    id: z.string().uuid(),
    couple_id: z.string().uuid(),
    reason: z.string(),
    points: z.number().int(),
    occurred_on: z.string(),
    created_at: z.string()
});
export type XpEvent = z.infer<typeof ZXpEvent>;

// Push tokens for notifications
export const ZPushToken = z.object({
    user_id: z.string().uuid(),
    token: z.string(),
    platform: z.string().optional().nullable(),
    updated_at: z.string()
});
export type PushToken = z.infer<typeof ZPushToken>;



// Couple Requests
export const ZCoupleRequestStatus = z.enum(["pending", "accepted", "declined", "canceled", "expired"]);

export const ZCoupleRequest = z.object({
    id: z.string().uuid(),
    requester_id: z.string().uuid(),
    recipient_id: z.string().uuid(),
    status: ZCoupleRequestStatus,
    message: z.string().optional().nullable(),
    created_at: z.string(),
    responded_at: z.string().optional().nullable()
});
export type CoupleRequest = z.infer<typeof ZCoupleRequest>;

export const ZSendCoupleRequest = z.object({
    recipient_handle: z.string().min(1),
    message: z.string().optional().nullable()
});

