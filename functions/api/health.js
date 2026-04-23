export async function onRequestGet(context) {
  console.log("🏥 Health check requested");
  return new Response(JSON.stringify({ status: "ok", time: new Date().toISOString() }), {
    headers: { "Content-Type": "application/json" }
  });
}
