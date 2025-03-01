import type { APIRoute } from 'astro';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

import { getCollection, getEntry } from 'astro:content';

export const get: APIRoute = async ({ params }) => {
  try {
    if (params.id) {
      // Get single post
      const post = await getEntry('posts', params.id);
      if (!post) {
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(post), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Get all posts
      const posts = await getCollection('posts');
      return new Response(JSON.stringify(posts), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch posts' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const post: APIRoute = async ({ request }) => {
  try {
    const post = await request.json();
    const postsDir = path.join(process.cwd(), 'src/content/posts');
    
    // Ensure posts directory exists
    await mkdir(postsDir, { recursive: true });

    // Generate slug from title
    const slug = post.slug || post.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create frontmatter
    const frontmatter = {
      title: post.title,
      description: post.description,
      pubDate: post.pubDate || new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      author: post.author || 'Default Author',
      draft: post.draft || false,
      featured: post.featured || false,
      tags: post.tags || [],
      category: post.category,
      image: post.image
    };

    // Create markdown content
    const markdown = `---
${Object.entries(frontmatter)
  .map(([key, value]) => `${key}: ${
    typeof value === 'string' 
      ? `"${value}"`
      : Array.isArray(value)
        ? `[${value.map(v => `"${v}"`).join(', ')}]`
        : JSON.stringify(value)
  }`)
  .join('\n')}
---

${post.content}`;

    // Write to file
    await writeFile(
      path.join(postsDir, `${slug}.md`),
      markdown
    );

    return new Response(JSON.stringify({ 
      success: true,
      slug,
      ...frontmatter
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to save post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
