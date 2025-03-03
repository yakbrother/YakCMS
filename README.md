# YakCMS

A modern, secure, and feature-rich content management system built with Astro, focusing on flexibility, security, and modern web development practices.

## Core Features

### Content Management
- Rich text post editor with Markdown support
- Post versioning and revision history
- Post scheduling and publishing workflow
- Multi-language content support
- SEO metadata management
- Content templates and snippets

### Media Management
- Advanced media library with bulk operations
- Image optimization and automatic resizing
- File type and size validation
- Metadata management (alt text, captions)
- Media categorization and tagging
- Bulk operations (delete, tag, move)

### Authentication & Security
- Multiple authentication methods:
  - Email/Password
  - GitHub OAuth
  - Google OAuth
- Two-factor authentication (2FA)
  - TOTP-based (authenticator apps)
  - Email-based verification
- Role-based access control
- Session management with JWT
- Password reset and email verification

### Backup System
- Automated backup system
  - Full, incremental, and differential backups
  - Encrypted backups
  - Configurable retention policies
  - One-click restore

## Installation

```bash
npm install yak-cms
```

## Environment Setup

Create a `.env` file with the following configuration:

```env
# Authentication
AUTH_SECRET=your-secure-random-string
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
GOOGLE_ID=your-google-oauth-app-id
GOOGLE_SECRET=your-google-oauth-app-secret

# Email (SMTP)
SMTP_HOST=your-smtp-server
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com

# Database
DATABASE_URL=your-database-connection-string
```

## Configuration

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import yakCMS from 'yak-cms';

export default defineConfig({
  integrations: [
    yakCMS({
      // Content Management
      content: {
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'es'],
        versioning: true,
        scheduling: true
      },
      
      // Media
      media: {
        uploadDir: 'public/uploads',
        maxFileSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        optimization: {
          enabled: true,
          quality: 85
        }
      },
      
      // Authentication
      auth: {
        providers: ['email', 'github', 'google'],
        twoFactor: {
          enabled: true,
          methods: ['totp', 'email']
        },
        session: {
          duration: '7d'
        }
      },
      
      // Backup System
      backup: {
        schedule: '0 0 * * *', // Daily at midnight
        type: 'incremental',
        retention: 30,
        encryption: {
          enabled: true,
          algorithm: 'AES-256-GCM'
        }
      }
    })
  ]
});
```

## API Endpoints

### Content Management
- `GET /api/posts`: List posts with filtering and pagination
- `POST /api/posts`: Create a new post
- `PUT /api/posts/:id`: Update an existing post
- `GET /api/posts/:id/versions`: Get post version history
- `POST /api/posts/:id/versions`: Create a new version
- `POST /api/posts/:id/translations`: Create post translation

### Media Management
- `GET /api/media`: List media files with filtering
- `POST /api/media`: Upload new media
- `PUT /api/media/:id`: Update media metadata
- `POST /api/media/bulk/delete`: Bulk delete media files
- `POST /api/media/bulk/tag`: Bulk tag media files

### Authentication
- `POST /api/auth/login`: Email/password login
- `GET /api/auth/github`: GitHub OAuth login
- `GET /api/auth/google`: Google OAuth login
- `POST /api/auth/2fa/setup`: Set up 2FA
- `POST /api/auth/2fa/verify`: Verify 2FA token
- `POST /api/auth/reset-password`: Request password reset
- `PUT /api/auth/reset-password`: Complete password reset
- `POST /api/auth/verify-email`: Request email verification
- `PUT /api/auth/verify-email`: Complete email verification

### Backup System
- `GET /api/backups`: List available backups
- `POST /api/backups`: Create new backup
- `GET /api/backups/:id`: Get backup status
- `POST /api/backups/:id/restore`: Restore from backup

## Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yakbrother/YakCMS.git
   cd YakCMS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Run tests:
   ```bash
   npm run test        # Run all tests
   npm run test:watch  # Run tests in watch mode
   npm run test:ui     # Run tests with UI
   ```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT © [YakBrother](https://github.com/yakbrother)
