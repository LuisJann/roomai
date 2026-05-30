import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Nessun prompt fornito" }, { status: 400 });
    }

    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);
    // Usiamo il modello "flux" che ha una precisione e realismo architettonico nettamente superiore
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${seed}&model=flux`;

    // Facciamo la fetch server-to-server.
    // Usiamo uno User-Agent per non essere bloccati da Cloudflare.
    const response = await fetch(pollinationsUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/jpeg"
      }
    });

    if (!response.ok) {
      throw new Error(`Errore dal server di generazione: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const finalUrl = `data:image/jpeg;base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      outputUrl: finalUrl
    });
    
  } catch (err: any) {
    console.error("Generate API Error:", err);
    return NextResponse.json({ error: "Generate API Error: " + (err.message || String(err)) }, { status: 500 });
  }
}
