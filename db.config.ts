import { defineDb, defineTable, column } from '@astrojs/db';

export default defineDb({
  tables: {
    posts: defineTable({
      columns: {
        id: column.string({ primaryKey: true }),
        title: column.string(),
        content: column.string(),
        slug: column.string({ unique: true }),
        status: column.string(), // draft, published, scheduled
        publishedAt: column.date({ optional: true }),
        scheduledFor: column.date({ optional: true }),
        authorId: column.string(),
        categoryId: column.string({ optional: true }),
        createdAt: column.date(),
        updatedAt: column.date(),
      }
    }),
    
    categories: defineTable({
      columns: {
        id: column.string({ primaryKey: true }),
        name: column.string(),
        slug: column.string({ unique: true }),
        description: column.string({ optional: true }),
        parentId: column.string({ optional: true }),
        createdAt: column.date(),
        updatedAt: column.date(),
      }
    }),

    tags: defineTable({
      columns: {
        id: column.string({ primaryKey: true }),
        name: column.string(),
        slug: column.string({ unique: true }),
        createdAt: column.date(),
      }
    }),

    postTags: defineTable({
      columns: {
        postId: column.string(),
        tagId: column.string(),
        createdAt: column.date(),
      },
      indexes: {
        postTagUnique: {
          columns: ['postId', 'tagId'],
          unique: true,
        }
      }
    }),

    users: defineTable({
      columns: {
        id: column.string({ primaryKey: true }),
        email: column.string({ unique: true }),
        name: column.string(),
        password: column.string(),
        role: column.string(), // admin, editor, author
        createdAt: column.date(),
        updatedAt: column.date(),
      }
    }),

    media: defineTable({
      columns: {
        id: column.string({ primaryKey: true }),
        filename: column.string(),
        path: column.string(),
        mimeType: column.string(),
        size: column.number(),
        uploadedBy: column.string(),
        createdAt: column.date(),
      }
    }),

    settings: defineTable({
      columns: {
        key: column.string({ primaryKey: true }),
        value: column.string(),
        updatedAt: column.date(),
      }
    })
  }
});
