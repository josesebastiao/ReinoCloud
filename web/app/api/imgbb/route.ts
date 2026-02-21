import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const image = body?.image;
    if (!image) return NextResponse.json({ error: 'Imagem ausente' }, { status: 400 });

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Chave imgbb não configurada' }, { status: 500 });

    // Forward to imgbb
    const form = new FormData();
    // imgbb expects raw base64 without data: prefix in the 'image' field
    const base64 = (image as string).replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    form.append('key', apiKey);
    form.append('image', base64);

    const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'ImgBB retornou erro', details: text }, { status: 502 });
    }
    const json = await res.json();
    const url = json?.data?.url || json?.data?.display_url;
    return NextResponse.json({ url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
