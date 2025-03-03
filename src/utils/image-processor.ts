import sharp from 'sharp';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { randomUUID } from 'crypto';

interface ProcessImageOptions {
  generateSizes?: boolean;
  sizes?: {
    [key: string]: number;
  };
}

interface ProcessedImage {
  path: string;
  thumbnailPath?: string;
  sizes?: {
    [key: string]: string;
  };
}

interface ImageMetadata {
  width: number;
  height: number;
  format: string;
}

export async function processImage(
  file: File,
  options: ProcessImageOptions = {}
): Promise<ProcessedImage> {
  const { generateSizes = false, sizes = {} } = options;

  // Create upload directories if they don't exist
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
  await mkdir(uploadsDir, { recursive: true });
  await mkdir(thumbnailsDir, { recursive: true });

  // Generate unique filename
  const ext = path.extname(file.name);
  const filename = `${randomUUID()}${ext}`;
  const filepath = path.join(uploadsDir, filename);

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process original image
  const image = sharp(buffer);
  await image.toFile(filepath);

  // Generate thumbnail
  const thumbnailPath = path.join(thumbnailsDir, filename);
  await image
    .resize(200, 200, { fit: 'cover' })
    .toFile(thumbnailPath);

  const result: ProcessedImage = {
    path: `/uploads/${filename}`,
    thumbnailPath: `/uploads/thumbnails/${filename}`
  };

  // Generate additional sizes if requested
  if (generateSizes && Object.keys(sizes).length > 0) {
    result.sizes = {};
    
    for (const [name, width] of Object.entries(sizes)) {
      const sizePath = path.join(uploadsDir, `${path.parse(filename).name}-${width}w${ext}`);
      await image
        .resize(width, null, { fit: 'inside' })
        .toFile(sizePath);
      
      result.sizes[name] = `/uploads/${path.parse(filename).name}-${width}w${ext}`;
    }
  }

  return result;
}

export async function getImageMetadata(filepath: string): Promise<ImageMetadata> {
  const absolutePath = path.join(process.cwd(), 'public', filepath);
  const metadata = await sharp(absolutePath).metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || ''
  };
}
