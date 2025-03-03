import type { APIRoute } from 'astro';
import { readFile, writeFile, unlink } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

import { getCollection, getEntry } from 'astro:content';

interface PostParams {
  id?: string;
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

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
      const { page, limit, status, search } = params as PostParams;
      let posts = await getCollection('posts');

      // Apply filters
      if (status) {
        posts = posts.filter(post => post.data.status === status);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        posts = posts.filter(post => 
          post.data.title.toLowerCase().includes(searchLower) ||
          post.body.toLowerCase().includes(searchLower)
        );
      }

      // Handle pagination
      if (page && limit) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const start = (pageNum - 1) * limitNum;
        const end = start + limitNum;
        const totalPages = Math.ceil(posts.length / limitNum);

        return new Response(JSON.stringify({
          posts: posts.slice(start, end),
          totalPages,
          currentPage: pageNum
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      // Return filtered posts
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

export const put: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;
    const post = await request.json();

    // Check if post exists
    const existingPost = await getEntry('posts', id!);
    if (!existingPost) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check version for concurrent updates
    if (post.version && existingPost.data.version > post.version) {
      return new Response(JSON.stringify({ error: 'Post has been modified' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update post file
    const postsDir = path.join(process.cwd(), 'src/content/posts');
    const postPath = path.join(postsDir, `${id}.md`);

    const frontmatter = {
      ...existingPost.data,
      ...post,
      updatedDate: new Date().toISOString(),
      version: (existingPost.data.version || 0) + 1
    };

    const markdown = `---
${Object.entries(frontmatter)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join('\n')}
---

${post.content || existingPost.body}`;

    await writeFile(postPath, markdown);

    return new Response(JSON.stringify({
      id,
      ...frontmatter
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const del: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    // Check if post exists
    const post = await getEntry('posts', id!);
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete post file
    const postsDir = path.join(process.cwd(), 'src/content/posts');
    const postPath = path.join(postsDir, `${id}.md`);
    await unlink(postPath);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const post: APIRoute = async ({ request }) => {
  try {
    const post = await request.json();
    
    // Validate required fields
    if (!post.title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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
