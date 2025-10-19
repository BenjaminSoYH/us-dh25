// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

// Helper to build a Supabase client bound to the caller's JWT (RLS enforced)
function supabaseClientForRequest(req: Request) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string
    const authHeader = req.headers.get('Authorization') ?? ''
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
    })
}

type SummarizeBody = {
    kind: 'journal_summary'
    journal_id: string
}

async function summarizeWithOpenAI(content: string, title: string | null) {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) throw new Error('OPENAI_API_KEY not set')

    const system = `You summarize private journal entries to help a partner understand feelings and needs.
Be concise, kind, and practical. Use neutral, supportive language. Include 3-5 bullet takeaways and 2 suggestions
for how the partner can respond better. Avoid diagnosing. Keep under 180 words.`

    const user = `Title: ${title ?? 'Untitled'}\n\nEntry:\n${content}`

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
            temperature: 0.4,
            max_tokens: 400,
        }),
    })

    if (!resp.ok) {
        const msg = await resp.text()
        throw new Error(`OpenAI error ${resp.status}: ${msg}`)
    }
    const data = await resp.json()
    const text: string = data.choices?.[0]?.message?.content ?? ''
    return { summary: text, model: data.model ?? 'gpt-4o-mini' }
}

Deno.serve(async (req: Request) => {
    try {
        if (req.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 })
        }

        const { kind, journal_id } = (await req.json()) as SummarizeBody
        if (kind !== 'journal_summary' || !journal_id) {
            return new Response('Bad Request', { status: 400 })
        }

        const supabase = supabaseClientForRequest(req)

        // Load the journal with RLS enforced; only owner can fetch
        const { data: journal, error: jErr } = await supabase
            .from('journals')
            .select('id, user_id, title, content, visibility')
            .eq('id', journal_id)
            .single()
        if (jErr || !journal) {
            return new Response('Not found', { status: 404 })
        }

        // Summarize content
        const { summary, model } = await summarizeWithOpenAI(journal.content as string, journal.title as string | null)

        // Who is calling?
        const { data: userRes } = await supabase.auth.getUser()
        const callerId = userRes?.user?.id ?? null

        // Insert append-only summary and also update convenience column on journals
        const { error: insErr } = await supabase
            .from('journal_summaries')
            .insert({ journal_id, generated_by: callerId, summary, model })
        if (insErr) throw insErr

        const { error: upErr } = await supabase
            .from('journals')
            .update({ ai_summary: summary })
            .eq('id', journal_id)
        if (upErr) throw upErr

        return new Response(JSON.stringify({ ok: true, summary }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (e: any) {
        return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})


