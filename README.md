# 👋 Welcome to YakCMS!

Hey there! Looking for a modern CMS that's actually fun to work with? You've found it! YakCMS is built with Astro and designed to make content management a breeze while keeping your data secure and your workflow smooth.

## ✨ What Makes YakCMS Special?

### 📝 Content That Works for You
- Write in style with our Markdown-powered editor
- Never lose work with automatic version history
- Schedule posts for the perfect timing
- Reach global audiences with multi-language support
- Boost your SEO game with built-in tools
- Save time with reusable templates

### 🖼️ Media Made Simple
- Drag-and-drop file uploads
- Auto-optimization for lightning-fast loading
- Smart file validation to keep things safe
- Easy metadata management
- Quick bulk actions when you need them

### 🔐 Rock-Solid Security
- Login your way:
  - Classic email/password
  - Quick GitHub login
  - Easy Google sign-in
- Extra protection with 2FA
  - Use your favorite authenticator app
  - Fallback to email verification
- Granular permissions for your team
- Secure sessions with JWT
- Hassle-free password recovery

### 💾 Peace of Mind
- Automatic backups that just work
  - Choose your backup style
  - Bank-grade encryption
  - Keep what you need, auto-clean the rest
  - Restore with one click

## 🚀 Get Started in 5 Minutes

1. Install YakCMS:
```bash
npm install yak-cms
```

2. Create your `.env` file:
```env
# The essentials
AUTH_SECRET=pick-something-super-secret
DATABASE_URL=your-database-url

# Optional: Social login
GITHUB_ID=your-github-app-id
GITHUB_SECRET=your-github-secret
GOOGLE_ID=your-google-app-id
GOOGLE_SECRET=your-google-secret

# Optional: Email notifications
SMTP_HOST=your-smtp-server
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

3. Set up your `astro.config.mjs`:
```typescript
import { defineConfig } from 'astro/config';
import yakCMS from 'yak-cms';

export default defineConfig({
  integrations: [
    yakCMS({
      // Content settings
      content: {
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'es'],
        versioning: true,
        scheduling: true
      },
      
      // Media settings
      media: {
        uploadDir: 'public/uploads',
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        optimization: {
          enabled: true,
          quality: 85
        }
      },
      
      // Auth settings
      auth: {
        providers: ['email', 'github', 'google'],
        twoFactor: {
          enabled: true,
          methods: ['totp', 'email']
        }
      },
      
      // Backup settings
      backup: {
        schedule: '0 0 * * *', // Every night at midnight
        type: 'incremental',
        retention: 30,
        encryption: { enabled: true }
      }
    })
  ]
});
```

## 🛠️ API Quick Reference

### Content
- `GET /api/posts` - Browse your posts
- `POST /api/posts` - Create something new
- `PUT /api/posts/:id` - Update your content
- `GET /api/posts/:id/versions` - View post history
- `POST /api/posts/:id/versions` - Save a version
- `POST /api/posts/:id/translations` - Add translations

### Media
- `GET /api/media` - Browse your files
- `POST /api/media` - Upload new stuff
- `PUT /api/media/:id` - Update file details
- `POST /api/media/bulk/*` - Bulk actions

### Auth
- `POST /api/auth/login` - Sign in
- `GET /api/auth/{github|google}` - Social login
- `POST /api/auth/2fa/*` - 2FA management
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/verify-email` - Email verification

### Backups
- `GET /api/backups` - View your backups
- `POST /api/backups` - Create a backup
- `POST /api/backups/:id/restore` - Restore when needed

## 🌱 Want to Run it Locally?

1. Clone it:
```bash
git clone https://github.com/yakbrother/YakCMS.git
cd YakCMS
```

2. Install everything:
```bash
npm install
```

3. Set up your environment:
```bash
cp .env.example .env
# Fill in your details
```

4. Start coding:
```bash
npm run dev
```

## 🤝 Want to Help?

We'd love your contributions! Here's how:

1. Fork the repo
2. Create your branch: `git checkout -b feature/cool-stuff`
3. Make your changes
4. Push to your branch: `git push origin feature/cool-stuff`
5. Open a PR and let's chat!

## 📄 License

MIT © [YakBrother](https://github.com/yakbrother)
