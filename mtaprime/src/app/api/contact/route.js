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
    !["firstName", "lastName", "email", "subject", "message"].every(
      (key) => typeof data[key] === "string" && data[key].trim(),
    ) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
    data.message.length > 5000 ||
    data.message.length < 10
  )
    return Response.json({ code: "INVALID_REQUEST" }, { status: 400 });
  // Add authenticated mail/CRM delivery and server rate limiting here.
  // A success response must only follow confirmed delivery; do not log personal data.
  return Response.json({ code: "NOT_CONFIGURED" }, { status: 503 });
}
