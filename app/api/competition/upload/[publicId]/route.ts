import { NextRequest } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(params.publicId, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    return Response.json(result);
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(error instanceof Error ? error.message : 'Delete failed', { status: 500 });
  }
} 