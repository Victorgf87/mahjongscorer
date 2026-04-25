/**
 * API Endpoint: /api/history
 * Fetches play history from D1 for a specific user.
 */

export async function onRequestGet(context) {
    const { request, env } = context;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    if (!env.DB) {
        return new Response(JSON.stringify({ error: "Database not configured" }), { status: 500 });
    }

    try {
        const { results } = await env.DB.prepare(`
            SELECT timestamp, mode, input_text, ai_raw_response 
            FROM plays 
            WHERE user_id = ? 
            ORDER BY timestamp DESC 
            LIMIT 20
        `).bind(userId).all();

        return new Response(JSON.stringify({ success: true, history: results }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
