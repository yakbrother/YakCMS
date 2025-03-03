import type { APIRoute } from 'astro';
import { getCollection, getEntry, deleteEntry } from 'astro:content';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { processImage, getImageMetadata } from '../utils/image-processor';

interface MediaItem {
  id: string;
  filename: string;
  type: string;
  size: number;
  path: string;
  thumbnailPath?: string;
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
  };
  sizes?: {
    [key: string]: string;
  };
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const get: APIRoute = async ({ params }) => {
  try {
    if (params.id) {
      const media = await getEntry('media', params.id);
      if (!media) {
        return new Response(JSON.stringify({ error: 'Media not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(media), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      let media = await getCollection('media');

      // Filter by type if specified
      if (params.type) {
        media = media.filter(item => item.data.type.startsWith(params.type));
      }

      return new Response(JSON.stringify(media), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch media' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const post: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const generateSizes = formData.get('generateSizes') === 'true';

    // Validate file
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process image
    const processedImage = await processImage(file, {
      generateSizes,
      sizes: generateSizes ? {
        small: 300,
        medium: 800,
        large: 1200
      } : undefined
    });

    // Get image metadata
    const metadata = await getImageMetadata(processedImage.path);

    // Create media item
    const mediaItem: MediaItem = {
      id: path.basename(processedImage.path, path.extname(processedImage.path)),
      filename: file.name,
      type: file.type,
      size: file.size,
      path: processedImage.path,
      thumbnailPath: processedImage.thumbnailPath,
      metadata,
      sizes: processedImage.sizes
    };

    // Save media item metadata
    const mediaDir = path.join(process.cwd(), 'src/content/media');
    await writeFile(
      path.join(mediaDir, `${mediaItem.id}.json`),
      JSON.stringify(mediaItem, null, 2)
    );

    return new Response(JSON.stringify(mediaItem), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to upload media' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const del: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    // Check if media exists
    const media = await getEntry('media', id!);
    if (!media) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if media is in use
    const posts = await getCollection('posts');
    const isInUse = posts.some(post => 
      post.body.includes(media.data.path) || 
      post.data.image === media.data.path
    );

    if (isInUse) {
      return new Response(JSON.stringify({ error: 'Media is in use' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete media files
    await unlink(media.data.path);
    if (media.data.thumbnailPath) {
      await unlink(media.data.thumbnailPath);
    }
    if (media.data.sizes) {
      await Promise.all(
        Object.values(media.data.sizes).map(path => unlink(path))
      );
    }

    // Delete media metadata
    await deleteEntry('media', id!);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete media' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
