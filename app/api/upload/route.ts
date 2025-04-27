import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const location = formData.get('location') as string;
  const date = formData.get('date') as string;

  if (!file) {
    return new Response('No file uploaded', { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filename = `${Date.now()}-${file.name}`;

  // Upload file to storage
  const { data, error } = await supabaseAdmin.storage
    .from(process.env.SUPABASE_BUCKET!)
    .upload(filename, buffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    console.error(error);
    return new Response('Upload failed', { status: 500 });
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${process.env.SUPABASE_BUCKET}/${filename}`;

  // Store metadata in Supabase database
  const { error: dbError } = await supabaseAdmin
    .from('gallery_images')
    .insert([
      {
        title,
        description,
        category,
        location,
        date,
        image_url: url,
        aspect_ratio: 'square' // You can determine this based on image dimensions
      }
    ]);

  if (dbError) {
    console.error(dbError);
    return new Response('Database insert failed', { status: 500 });
  }

  return Response.json({ url });
} 