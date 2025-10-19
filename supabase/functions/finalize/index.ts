// @ts-nocheck
// deno-lint-ignore-file no-explicit-anyimport 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// Supabase Edge Function (Deno) sketch to stitch dual photos and insert a post
// NOTE: Sharp/node-native deps require compatible runtime (WASM or server bundling). Treat as scaffold.
import { createClient } from "@supabase/supabase-js";
// import sharp from "sharp"; // replace with WASM-capable image lib for Deno, or run on a server

// Minimal payload; server resolves couple_id from prompt and user from auth
type FinalizePayload = {
    prompt_id: string;
    is_late?: boolean;
    back_key: string;
    front_key: string;
};

// In production, validate JWT from Authorization header and infer user_id
Deno.serve(async (req) => {
    try {
        const { prompt_id, is_late = false, back_key, front_key } = await req.json() as FinalizePayload;
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // 1) Download raw images from Storage (private bucket recommended)
        const bucket = "dual-photos";
        const [back, front] = await Promise.all([
            supabase.storage.from(bucket).download(back_key),
            supabase.storage.from(bucket).download(front_key)
        ]);
        if (!back.data || !front.data) throw new Error("Missing images");

        // 2) Stitch images (placeholder). Implement with a Deno-compatible image lib.
        const stitchedBytes = await front.data.arrayBuffer(); // TODO: replace with real stitching

        // 3) Upload final image
        const finalKey = `final/${crypto.randomUUID()}.jpg`;
        const up = await supabase.storage.from(bucket).upload(finalKey, new Uint8Array(stitchedBytes), { contentType: "image/jpeg", upsert: false });
        if (up.error) throw up.error;
        const image_url = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/${bucket}/${finalKey}`;

        // 4) Resolve couple_id from prompt
        const { data: prompt } = await supabase.from("prompts").select("couple_id").eq("id", prompt_id).single();
        if (!prompt) throw new Error("Prompt not found");

        // 5) Caller identity (hackathon-mode). Prefer verifying JWT and using supabase.auth.
        const user_id = req.headers.get("x-user-id");
        if (!user_id) throw new Error("Missing user_id");

        // 6) Insert final post (service role bypasses RLS)
        const { data: post, error: postErr } = await supabase.from("posts")
            .insert({ couple_id: prompt.couple_id, prompt_id, user_id, image_url, is_late })
            .select()
            .single();
        if (postErr) throw postErr;

        return new Response(JSON.stringify(post), { status: 200 });
    } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 400 });
    }
});


