# YakCMS

A modern, lightweight CMS built with Astro that provides post editing capabilities with image upload support.

## Features

- Rich text post editor
- Image upload with optimization
- Automatic image resizing and compression
- Modern, responsive UI
- TypeScript support

## Installation

```bash
npm install yak-cms
```

## Usage

1. Add the plugin to your Astro config:

```typescript
// astro.config.mjs
import postEditor from 'yak-cms';

export default defineConfig({
  integrations: [
    postEditor({
      uploadDir: 'public/uploads', // optional, defaults to 'public/uploads'
      maxFileSize: 5 * 1024 * 1024 // optional, defaults to 5MB
    })
  ]
});
```

2. Use the editor component in your Astro pages:

```astro
---
import { PostEditor } from 'yak-cms';
---

<PostEditor postId="optional-post-id" />
```

## Configuration Options

- `uploadDir`: Directory where uploaded images will be stored (relative to project root)
- `maxFileSize`: Maximum allowed file size for image uploads in bytes

## API Endpoints

The plugin adds the following API endpoints:

- `POST /api/upload`: Handle image uploads
- `GET /api/posts`: Get all posts
- `POST /api/posts`: Create or update a post

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. For development: `npm run dev`

## License

MIT
