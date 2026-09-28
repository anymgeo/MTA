/** @param {{name:string,email:string,phone:string,subject:string,message:string}} payload */
export async function sendContactMessage(payload) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Contact service unavailable");
  return response.json();
}
