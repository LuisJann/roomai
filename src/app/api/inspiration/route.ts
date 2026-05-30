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

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Nessun prompt fornito" }, { status: 400 });
    }

    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

    let response;
    let maxRetries = 4; // Ritenta fino a 4 volte
    let delay = 2500; // Aspetta 2.5 secondi tra ogni tentativo

    for (let i = 0; i < maxRetries; i++) {
      response = await fetch(url);
      if (response.ok) {
        break; // Successo, usciamo dal ciclo
      }
      
      const text = await response.text();
      // Se l'errore è "Queue full", aspettiamo e riproviamo
      if (text.includes("Queue full") || response.status === 429) {
        if (i === maxRetries - 1) {
          return NextResponse.json({ error: "Il server AI gratuito è molto affollato. Riprova tra 30 secondi." }, { status: 429 });
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return NextResponse.json({ error: "Errore da Pollinations: " + text }, { status: response.status });
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json({ error: "Impossibile generare l'immagine." }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ritorna l'immagine in Base64
    const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    return NextResponse.json({ success: true, imageUrl: base64Image });
  } catch (err: any) {
    console.error("Pollinations Proxy Error:", err);
    return NextResponse.json({ error: "Internal Server Error: " + (err.message || String(err)) }, { status: 500 });
  }
}
