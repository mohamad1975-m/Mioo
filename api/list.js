export const config = { runtime: 'edge' };

const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export default async function handler() {
  if (!URL || !TOKEN) {
    return new Response('Upstash is not configured', { status: 500 });
  }

  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${TOKEN}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(["LRANGE", "messages", "0", "199"]) 
  });

  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    return new Response(`Upstash error: ${text}`, { status: 502 });
  }

  const { result } = await res.json();
  const out = [];
  for (const s of (result || [])) {
    try { out.push(JSON.parse(s)); } catch {}
  }
  out.sort((a,b)=> (b?.timestamp||0) - (a?.timestamp||0));

  return new Response(JSON.stringify(out), { status: 200, headers: { 'content-type': 'application/json' } });
}
