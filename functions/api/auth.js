/**
 * API Endpoint: /api/auth
 * Magic Link Authentication System
 */

export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'request') return handleRequestLink(request, env);
    if (action === 'verify') return handleVerifyToken(request, env);

    return new Response("Not Found", { status: 404 });
}

async function handleRequestLink(request, env) {
    const { email } = await request.json();
    if (!email || !email.includes('@')) return new Response("Invalid email", { status: 400 });

    const token = Math.random().toString(36).substr(2, 24);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    await env.DB.prepare(`
        INSERT INTO auth_tokens (token, email, expires_at) VALUES (?, ?, ?)
    `).bind(token, email, expiresAt).run();

    // Asegurar que el usuario existe
    await env.DB.prepare(`
        INSERT OR IGNORE INTO users (email) VALUES (?)
    `).bind(email).run();

    const magicLink = `https://testing.mahjong-scorer-pwa.pages.dev/history.html?token=${token}`;

    // ENVIAR EMAIL (Simulado si no hay API Key)
    console.log(`MAGIC LINK PARA ${email}: ${magicLink}`);
    
    // Si tienes RESEND_API_KEY en tus secretos, enviaría el email real aquí
    if (env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'Mahjong Scorer <auth@mahjongscorer.com>',
                to: email,
                subject: 'Tu enlace de acceso a Mahjong Scorer',
                html: `<p>Haz clic aquí para entrar: <a href="${magicLink}">${magicLink}</a></p>`
            })
        });
    }

    return new Response(JSON.stringify({ success: true, debugLink: magicLink }), {
        headers: { "Content-Type": "application/json" }
    });
}

async function handleVerifyToken(request, env) {
    const { token } = await request.json();
    
    const row = await env.DB.prepare(`
        SELECT email FROM auth_tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP
    `).bind(token).first();

    if (!row) return new Response(JSON.stringify({ error: "Token inválido o expirado" }), { status: 401 });

    // Consumir el token
    await env.DB.prepare(`DELETE FROM auth_tokens WHERE token = ?`).bind(token).run();

    return new Response(JSON.stringify({ success: true, email: row.email }), {
        headers: { "Content-Type": "application/json" }
    });
}
