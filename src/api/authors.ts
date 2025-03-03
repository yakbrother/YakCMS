import type { APIRoute } from 'astro';
import { getCollection, getEntry, updateEntry, deleteEntry } from 'astro:content';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

interface Author {
  id: string;
  name: string;
  email: string;
  bio?: string;
  role?: string;
  avatar?: string;
}

export const get: APIRoute = async ({ params }) => {
  try {
    if (params.id) {
      const author = await getEntry('authors', params.id);
      if (!author) {
        return new Response(JSON.stringify({ error: 'Author not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(author), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const authors = await getCollection('authors');
      return new Response(JSON.stringify(authors), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch authors' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const post: APIRoute = async ({ request }) => {
  try {
    const author = await request.json();

    // Validate required fields
    if (!author.name || !author.email) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(author.email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique ID
    const id = author.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const authorsDir = path.join(process.cwd(), 'src/content/authors');

    // Create author file
    const authorData = {
      id,
      name: author.name,
      email: author.email,
      bio: author.bio || '',
      role: author.role || 'contributor',
      avatar: author.avatar || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await writeFile(
      path.join(authorsDir, `${id}.json`),
      JSON.stringify(authorData, null, 2)
    );

    return new Response(JSON.stringify(authorData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create author' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const put: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;
    const author = await request.json();

    // Check if author exists
    const existingAuthor = await getEntry('authors', id!);
    if (!existingAuthor) {
      return new Response(JSON.stringify({ error: 'Author not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for duplicate email
    if (author.email) {
      const authors = await getCollection('authors');
      const duplicateEmail = authors.find(a => 
        a.data.email === author.email && a.id !== id
      );
      if (duplicateEmail) {
        return new Response(JSON.stringify({ error: 'Email already in use' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Update author
    const updatedAuthor = {
      ...existingAuthor.data,
      ...author,
      updatedAt: new Date().toISOString()
    };

    await updateEntry('authors', id!, updatedAuthor);

    return new Response(JSON.stringify(updatedAuthor), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update author' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const del: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    // Check if author exists
    const author = await getEntry('authors', id!);
    if (!author) {
      return new Response(JSON.stringify({ error: 'Author not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if this is the last admin
    if (author.data.role === 'admin') {
      const authors = await getCollection('authors');
      const adminCount = authors.filter(a => a.data.role === 'admin').length;
      if (adminCount <= 1) {
        return new Response(JSON.stringify({ error: 'Cannot delete last admin author' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Delete author
    await deleteEntry('authors', id!);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete author' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
