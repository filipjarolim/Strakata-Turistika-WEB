import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';

interface CloudinaryResource {
  public_id: string;
  created_at: string;
  context?: {
    title?: string;
    created_at?: string;
  };
}

interface CloudinarySearchResult {
  resources: CloudinaryResource[];
}

export async function GET() {
  try {
    const result = await new Promise<CloudinarySearchResult>((resolve, reject) => {
      cloudinary.search
        .expression('folder:gallery/*')
        .sort_by('created_at', 'desc')
        .max_results(100)
        .with_field('context')
        .execute()
        .then(result => resolve(result as CloudinarySearchResult))
        .catch(error => reject(error));
    });

    // Transform the response to match our GalleryImage interface
    const transformedResources = result.resources.map((resource) => {
      // Generate optimized URL for each image
      const optimizedUrl = cloudinary.url(resource.public_id, {
        format: 'webp',
        quality: 'auto',
        fetch_format: 'auto',
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      });

      return {
        public_id: resource.public_id,
        url: optimizedUrl,
        title: resource.context?.title || 'Bez názvu',
        created_at: resource.context?.created_at || resource.created_at,
        category: 'all', // Default category since we removed categories
        description: '', // Empty description since we removed it
        location: '', // Empty location since we removed it
      };
    });

    return NextResponse.json({ resources: transformedResources });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
} 