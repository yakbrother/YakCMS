import { db } from '@astrojs/db';
import bcrypt from 'bcryptjs';

export async function seed() {
  // Create admin user
  await db.insert('users').values({
    id: 'admin',
    email: 'admin@example.com',
    name: 'Admin User',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create default category
  await db.insert('categories').values({
    id: 'uncategorized',
    name: 'Uncategorized',
    slug: 'uncategorized',
    description: 'Default category for uncategorized posts',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Add default settings
  const defaultSettings = [
    { key: 'site_name', value: 'YakCMS' },
    { key: 'site_description', value: 'A modern CMS built with Astro' },
    { key: 'posts_per_page', value: '10' },
    { key: 'default_category', value: 'uncategorized' },
  ];

  for (const setting of defaultSettings) {
    await db.insert('settings').values({
      ...setting,
      updatedAt: new Date(),
    });
  }
}
