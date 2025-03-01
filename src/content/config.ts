import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    author: z.string().default('Anonymous'),
    image: z.object({
      url: z.string(),
      alt: z.string().optional(),
      caption: z.string().optional(),
      srcset: z.array(z.object({
        url: z.string(),
        width: z.number(),
        size: z.enum(['sm', 'md', 'lg'])
      })).optional()
    }).optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    category: z.string().optional()
  })
});

const authors = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    social: z.object({
      twitter: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional()
    }).optional()
  })
});

const categories = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    featured: z.boolean().default(false)
  })
});

export const collections = {
  posts,
  authors,
  categories
};
