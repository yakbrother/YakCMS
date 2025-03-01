import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const post: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public/assets/posts');

    // Ensure upload directory exists
    await mkdir(uploadDir, { recursive: true });

    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);

    // Create optimized versions
    const sizes = {
      lg: 1200,
      md: 800,
      sm: 400
    };

    const optimizedImages = await Promise.all(
      Object.entries(sizes).map(async ([size, width]) => {
        const optimized = await sharp(buffer)
          .resize(width, null, { 
            fit: 'inside',
            withoutEnlargement: true
          })
          .format('webp') // Use WebP for better compression
          .webp({ 
            quality: 80,
            effort: 6 // Higher compression effort
          })
          .toBuffer();

        const sizeFilename = `${basename}-${size}.webp`;
        await writeFile(path.join(uploadDir, sizeFilename), optimized);
        return {
          size,
          width,
          height: Math.round(width * (metadata.height / metadata.width)),
          url: `/assets/posts/${sizeFilename}`
        };
      })
    );

    // Also save original in high quality
    const originalOptimized = await sharp(buffer)
      .webp({ 
        quality: 90,
        effort: 6
      })
      .toBuffer();

    const originalFilename = `${basename}-original.webp`;
    await writeFile(path.join(uploadDir, originalFilename), originalOptimized);

    return new Response(JSON.stringify({ 
      success: true,
      filename: originalFilename,
      url: `/assets/posts/${originalFilename}`,
      sizes: optimizedImages,
      original: {
        url: `/assets/posts/${originalFilename}`,
        width: metadata.width,
        height: metadata.height
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
