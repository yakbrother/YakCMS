import { defineDb, sql } from '@astrojs/db';
import { Auth } from '@auth/core';
import GitHub from '@auth/core/providers/github';
import Google from '@auth/core/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';

// Define the users table
export const users = defineDb.table('users', {
  id: defineDb.text().primaryKey(),
  name: defineDb.text(),
  email: defineDb.text().unique(),
  emailVerified: defineDb.datetime(),
  password: defineDb.text(),
  image: defineDb.text(),
  role: defineDb.text().default('user'),
  createdAt: defineDb.datetime().default(sql`CURRENT_TIMESTAMP`),
});

// Define the accounts table for OAuth
export const accounts = defineDb.table('accounts', {
  id: defineDb.text().primaryKey(),
  userId: defineDb.text().references(() => users.id, { onDelete: 'cascade' }),
  type: defineDb.text(),
  provider: defineDb.text(),
  providerAccountId: defineDb.text(),
  refreshToken: defineDb.text(),
  accessToken: defineDb.text(),
  expiresAt: defineDb.integer(),
  tokenType: defineDb.text(),
  scope: defineDb.text(),
  idToken: defineDb.text(),
  sessionState: defineDb.text(),
});

// Define the sessions table
export const sessions = defineDb.table('sessions', {
  id: defineDb.text().primaryKey(),
  userId: defineDb.text().references(() => users.id, { onDelete: 'cascade' }),
  expires: defineDb.datetime(),
  sessionToken: defineDb.text().unique(),
});

// Define the verification tokens table
export const verificationTokens = defineDb.table('verificationTokens', {
  identifier: defineDb.text(),
  token: defineDb.text().unique(),
  expires: defineDb.datetime(),
});

export const auth = Auth({
  adapter: DrizzleAdapter(db),
  secret: process.env.AUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, credentials.email),
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    },
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
});
