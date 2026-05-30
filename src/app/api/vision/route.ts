import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
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
    const { image } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chiave Gemini non configurata sul server" }, { status: 500 });
    }

    if (!image) {
      return NextResponse.json({ error: "Nessuna immagine fornita" }, { status: 400 });
    }

    // Pulisci l'immagine dal prefisso
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "");

    // Initialize Gemini API
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Chiediamo a Gemini di descrivere la stanza
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: "You are the world's most precise and exhaustive interior architecture describer. Your sole purpose is to analyze this photo and write a hyper-detailed, microscopic, continuous paragraph in English that will allow a blind painter to perfectly recreate the exact 1:1 structure and layout of this room from scratch. \n\nYou MUST describe EVERYTHING: \n1. Exact dimensions, perspective, and vanishing points.\n2. The exact spatial location (x, y, z coordinates relative to the frame) of every single wall, the floor, and the ceiling.\n3. The precise shape, scale, position, and texture of every window, door, and structural element.\n4. Every single piece of furniture and object, mapping their exact location relative to each other and to the walls. \n\nLeave NOTHING out. Describe the scene practically pixel by pixel. Do NOT use JSON, bullet points, or lists. Write a dense, exhaustive, descriptive paragraph focusing purely on spatial layout, geometry, and structural placement." },
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg"
              }
            }
          ]
        }
      ]
    });

    const description = response.text;

    if (!description) {
      throw new Error("Nessuna descrizione generata da Gemini.");
    }

    return NextResponse.json({
      success: true,
      description: description,
    });
    
  } catch (err: any) {
    console.error("Gemini Vision API Error:", err);
    return NextResponse.json({ error: "Google Gemini Error: " + (err.message || String(err)) }, { status: 500 });
  }
}
