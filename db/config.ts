import { defineDb, defineTable, column } from 'astro:db';

const Comments = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    postId: column.string(),
    author: column.string(),
    content: column.text(),
    createdAt: column.date(),
    parentId: column.number({ optional: true }),
    approved: column.boolean({ default: false })
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
    uploadedAt: column.date()
  }
});

const Settings = defineTable({
  columns: {
    key: column.string({ primaryKey: true }),
    value: column.json(),
    updatedAt: column.date()
  }
});

export default defineDb({
  tables: {
    Comments,
    Media,
    Settings
  }
});
