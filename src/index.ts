import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'url';
import path from 'path';

interface PostEditorOptions {
  uploadDir?: string;
  maxFileSize?: number;
}

import { defineConfig } from 'astro/config';
import db from '@astrojs/db';

export default function postEditor(options: PostEditorOptions = {}): AstroIntegration {
  const resolvedOptions = {
    uploadDir: options.uploadDir || 'public/uploads',
    maxFileSize: options.maxFileSize || 5 * 1024 * 1024, // 5MB default
  };

  return {
    name: 'astro-post-editor',
    hooks: {
      'astro:config:setup': ({ injectRoute, updateConfig, config }) => {
      // Add database support
      config.integrations.push(db());

      // Update content config
      updateConfig({
        content: {
          sources: ['src/content'],
          collections: {
            posts: {
              entrySchema: 'src/content/config.ts#posts',
            },
            authors: {
              entrySchema: 'src/content/config.ts#authors',
            },
            categories: {
              entrySchema: 'src/content/config.ts#categories',
            },
          },
        },
      });
        // Inject the editor component route
        injectRoute({
          pattern: '/admin/editor',
          entryPoint: path.resolve(fileURLToPath(import.meta.url), '../pages/editor.astro')
        });

        // Inject the API routes for handling posts and uploads
        injectRoute({
          pattern: '/api/posts',
          entryPoint: path.resolve(fileURLToPath(import.meta.url), '../api/posts.ts')
        });

        injectRoute({
          pattern: '/api/upload',
          entryPoint: path.resolve(fileURLToPath(import.meta.url), '../api/upload.ts')
        });

        // Update config to ensure Node adapter is used
        updateConfig({
          output: 'server',
          adapter: '@astrojs/node'
        });
      },
      'astro:server:setup': ({ server }) => {
        // Configure upload directory
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/api/')) {
            // Add CORS headers for API routes
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          }
          next();
        });
      }
    }
  };
}
