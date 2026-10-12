// This route is outside /backend so the legacy catch-all rewrite cannot intercept it.
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{mapId:string}>}){
  const {mapId}=await params;if(!/^[a-f0-9-]{36}$/i.test(mapId))return new Response(null,{status:400});
  const headers=new Headers();for(const key of ['content-type','cookie','x-csrf-token','x-map-version']){const value=request.headers.get(key);if(value)headers.set(key,value);}
  const upstream=await fetch(`${process.env.API_ORIGIN||'http://127.0.0.1:5100'}/api/admin/maps/${mapId}/image-upload`,{method:'POST',headers,body:request.body,duplex:'half',signal:request.signal} as RequestInit&{duplex:string});
  return new Response(upstream.body,{status:upstream.status,headers:{'Content-Type':upstream.headers.get('content-type')||'application/json','Cache-Control':'no-store'}});
}
