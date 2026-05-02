// app/api/rpc/mainnet/route.js
export async function POST(req) {
  const body = await req.json()

  const response = await fetch(process.env.MAINNET_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return Response.json(await response.json())
}