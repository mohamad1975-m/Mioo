export const config = { runtime: 'edge' };

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!URL || !TOKEN) {
    return new Response('Upstash is not configured', { status: 500 });
  }

  const { message } = await req.json().catch(()=>({}));
  if (!message || String(message).trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const timestamp = Date.now();

  const record = { message: String(message).slice(0, 5000), ip, userAgent, timestamp };

  const commands = [
    ["LPUSH", "messages", JSON.stringify(record)],
    ["LTRIM", "messages", "0", "999"]
  ];

  const res = await fetch(`${URL}/pipeline`, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${TOKEN}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(commands)
  });

  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    return new Response(`Upstash error: ${text}`, { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
}
