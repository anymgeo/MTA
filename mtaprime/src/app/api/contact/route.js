import { env } from '@/config/env';
export async function POST(request) {
  if (Number(request.headers.get("content-length") || 0) > 20000)
    return Response.json({ code: "TOO_LARGE" }, { status: 413 });
  let data;
  try {
    const text = await request.text();
    if (text.length > 20000)
      return Response.json({ code: "TOO_LARGE" }, { status: 413 });
    data = JSON.parse(text);
  } catch {
    return Response.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }
  if (data?.website)
    return Response.json({ code: "REJECTED" }, { status: 400 });
  if (
    !data ||
    !["firstName", "email", "subject", "message"].every(
      (key) => typeof data[key] === "string" && data[key].trim(),
    ) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
    data.message.length > 5000 ||
    data.message.length < 10
  )
    return Response.json({ code: "INVALID_REQUEST" }, { status: 400 });
  if (!env.apiBaseUrl) return Response.json({ code: 'NOT_CONFIGURED' }, { status: 503 });
  try {
    const response = await fetch(env.apiBaseUrl.replace(/\/$/, '') + '/contact', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:AbortSignal.timeout(10000), cache:'no-store'
    });
    return Response.json(response.ok ? { received:true } : { code:'DELIVERY_FAILED' }, { status:response.status });
  } catch { return Response.json({ code:'DELIVERY_FAILED' }, { status:502 }); }
}
