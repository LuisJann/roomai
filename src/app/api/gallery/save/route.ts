import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { url, type } = await req.json();

    if (!url || !type) {
      return NextResponse.json({ error: 'Manca URL o type' }, { status: 400 });
    }

    if (type !== 'render' && type !== 'inspiration') {
      return NextResponse.json({ error: 'Type non valido' }, { status: 400 });
    }

    if (!url.startsWith('data:image/') && !url.startsWith('https://image.pollinations.ai/')) {
      return NextResponse.json({ error: 'URL non consentito per motivi di sicurezza' }, { status: 403 });
    }

    // 1. Scarica l'immagine dal server esterno (Pollinations)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const size_bytes = buffer.byteLength;

    // 2. Genera un nome file univoco e sicuro
    const fileExt = 'jpg';
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // 3. Carica nel Bucket 'gallery' di Supabase
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      throw new Error('Errore nel caricamento su Storage');
    }

    // 4. Ottieni l'URL pubblico del file
    const { data: publicUrlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // 5. Salva i metadati nella tabella 'user_images'
    const { error: dbError } = await supabase
      .from('user_images')
      .insert({
        user_id: user.id,
        type: type, // 'render' o 'inspiration'
        storage_path: fileName,
        public_url: publicUrl,
        size_bytes: size_bytes
      });

    if (dbError) {
      console.error('DB Insert Error:', dbError);
      // Fallback: se fallisce il DB, cerchiamo di non lasciare spazzatura
      await supabase.storage.from('gallery').remove([fileName]);
      throw new Error('Errore nel salvataggio su Database');
    }

    return NextResponse.json({ success: true, publicUrl });
  } catch (error: any) {
    console.error('Gallery Save Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
