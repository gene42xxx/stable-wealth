// app/api/rpc/sepolia/route.js
export async function POST(req) {
  const body = await req.json()
  const res = await fetch(process.env.ALCHEMY_SEPOLIA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return Response.json(await res.json())
}