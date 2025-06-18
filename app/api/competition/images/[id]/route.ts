import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await (params instanceof Promise ? params : Promise.resolve(params));
    
    const result = await new Promise((resolve, reject) => {
      cloudinary.search
        .expression(`folder:competition/${id}/*`)
        .sort_by('created_at', 'desc')
        .max_results(30)
        .execute()
        .then(result => resolve(result))
        .catch(error => reject(error));
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
} 