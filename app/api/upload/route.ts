import { NextRequest } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';
import { UploadApiResponse } from 'cloudinary';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;

  if (!file) {
    return new Response('No file uploaded', { status: 400 });
  }

  if (!title?.trim()) {
    return new Response('Title is required', { status: 400 });
  }

  // File size validation (10MB limit)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return new Response('Fotka je příliš velká (max 10 MB)', { status: 400 });
  }

  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64String}`;

    // Upload to Cloudinary with optimization settings
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload(dataURI, {
        folder: 'gallery',
        resource_type: 'auto',
        tags: ['gallery', `title:${title}`],
        context: {
          title: title,
          created_at: new Date().toISOString()
        },
        // Optimization settings
        format: 'webp', // Convert to WebP format
        quality: 'auto', // Automatic quality optimization
        fetch_format: 'auto', // Automatically choose the best format
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' }, // Limit maximum dimensions
          { quality: 'auto:good' }, // Good quality with automatic optimization
          { fetch_format: 'auto' } // Automatically choose the best format
        ]
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadApiResponse);
      });
    });

    // Get the optimized URL
    const optimizedUrl = cloudinary.url(result.public_id, {
      format: 'webp',
      quality: 'auto',
      fetch_format: 'auto',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    return Response.json({
      url: optimizedUrl,
      public_id: result.public_id,
      title: title,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(error instanceof Error ? error.message : 'Upload failed', { status: 500 });
  }
} 