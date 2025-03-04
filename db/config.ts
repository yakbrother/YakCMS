import { defineDb, defineTable, column } from '@astrojs/db';

const Posts = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    title: column.string(),
    content: column.text(),
    slug: column.string({ unique: true }),
    status: column.string(), // draft, published, scheduled
    publishedAt: column.date({ optional: true }),
    scheduledFor: column.date({ optional: true }),
    authorId: column.number(),
    categoryId: column.number({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  }
});

const Categories = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.string(),
    slug: column.string({ unique: true }),
    description: column.text({ optional: true }),
    parentId: column.number({ optional: true }),
    createdAt: column.date(),
    updatedAt: column.date(),
  }
});

const Tags = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    name: column.string(),
    slug: column.string({ unique: true }),
    createdAt: column.date(),
  }
});

const PostTags = defineTable({
  columns: {
    postId: column.number(),
    tagId: column.number(),
    createdAt: column.date(),
  },
  indexes: {
    postTagUnique: {
      columns: ['postId', 'tagId'],
      unique: true,
    }
  }
});

const Users = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    email: column.string({ unique: true }),
    name: column.string(),
    password: column.string(),
    role: column.string(), // admin, editor, author
    createdAt: column.date(),
    updatedAt: column.date(),
  }
});

const Media = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    filename: column.string(),
    originalUrl: column.string(),
    sizes: column.json(),
    alt: column.string({ optional: true }),
    caption: column.string({ optional: true }),
    metadata: column.json(),
    uploadedBy: column.number(),
    uploadedAt: column.date(),
  }
});

const Comments = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    postId: column.number(),
    author: column.string(),
    content: column.text(),
    createdAt: column.date(),
    parentId: column.number({ optional: true }),
    approved: column.boolean({ default: false })
  }
});

const Settings = defineTable({
  columns: {
    key: column.string({ primaryKey: true }),
    value: column.json(),
    updatedAt: column.date(),
  }
});

export default defineDb({
  tables: {
    Posts,
    Categories,
    Tags,
    PostTags,
    Users,
    Media,
    Comments,
    Settings
  }
});
