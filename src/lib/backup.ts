import type { BackupMetadata } from './types';
import { auditLogger } from './audit';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

export class BackupManager {
    private static instance: BackupManager;
    private backupDir: string;
    private backups: Map<string, BackupMetadata> = new Map();

    private constructor() {
        this.backupDir = path.join(process.cwd(), 'backups');
        this.initializeBackupDir();
    }

    public static getInstance(): BackupManager {
        if (!BackupManager.instance) {
            BackupManager.instance = new BackupManager();
        }
        return BackupManager.instance;
    }

    private async initializeBackupDir() {
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
            // Load existing backup metadata
            const files = await fs.readdir(this.backupDir);
            for (const file of files) {
                if (file.endsWith('.meta.json')) {
                    const content = await fs.readFile(path.join(this.backupDir, file), 'utf-8');
                    const metadata: BackupMetadata = JSON.parse(content);
                    this.backups.set(metadata.id, metadata);
                }
            }
        } catch (error) {
            console.error('Failed to initialize backup directory:', error);
        }
    }

    async createBackup(type: 'full' | 'content' | 'media', userId: string): Promise<BackupMetadata> {
        const backupId = crypto.randomUUID();
        const timestamp = new Date();
        const filename = `backup-${type}-${timestamp.toISOString()}.tar.gz`;
        const metaFilename = `${backupId}.meta.json`;
        
        const metadata: BackupMetadata = {
            id: backupId,
            timestamp,
            type,
            size: 0,
            createdBy: userId,
            status: 'pending',
            path: filename
        };

        try {
            // Create backup metadata
            await fs.writeFile(
                path.join(this.backupDir, metaFilename),
                JSON.stringify(metadata, null, 2)
            );

            // Perform the actual backup
            await this.performBackup(type, filename);

            // Update metadata with final size
            const stats = await fs.stat(path.join(this.backupDir, filename));
            metadata.size = stats.size;
            metadata.status = 'completed';

            await fs.writeFile(
                path.join(this.backupDir, metaFilename),
                JSON.stringify(metadata, null, 2)
            );

            this.backups.set(backupId, metadata);

            // Log the backup creation
            await auditLogger.log(
                'create_backup',
                userId,
                'backup',
                backupId,
                { type, size: metadata.size },
                'system'
            );

            return metadata;
        } catch (error) {
            metadata.status = 'failed';
            await fs.writeFile(
                path.join(this.backupDir, metaFilename),
                JSON.stringify(metadata, null, 2)
            );
            throw error;
        }
    }

    private async performBackup(type: 'full' | 'content' | 'media', filename: string): Promise<void> {
        const outputPath = path.join(this.backupDir, filename);
        const gzip = createGzip();
        const output = createWriteStream(outputPath);

        try {
            // Depending on the type, backup different directories
            const dirsToBackup = this.getDirectoriesToBackup(type);
            
            // Create tar archive
            // Note: This is a simplified version. In practice, you'd want to use
            // a proper tar library to handle this more robustly
            for (const dir of dirsToBackup) {
                const files = await this.getAllFiles(dir);
                for (const file of files) {
                    const readStream = createReadStream(file);
                    await pipeline(readStream, gzip, output);
                }
            }
        } catch (error) {
            console.error('Backup failed:', error);
            throw error;
        }
    }

    private getDirectoriesToBackup(type: 'full' | 'content' | 'media'): string[] {
        const contentDir = path.join(process.cwd(), 'src', 'content');
        const mediaDir = path.join(process.cwd(), 'public', 'media');
        const configDir = path.join(process.cwd(), 'config');

        switch (type) {
            case 'full':
                return [contentDir, mediaDir, configDir];
            case 'content':
                return [contentDir];
            case 'media':
                return [mediaDir];
            default:
                return [];
        }
    }

    private async getAllFiles(dir: string): Promise<string[]> {
        const files: string[] = [];
        
        async function scan(directory: string) {
            const entries = await fs.readdir(directory, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);
                if (entry.isDirectory()) {
                    await scan(fullPath);
                } else {
                    files.push(fullPath);
                }
            }
        }

        await scan(dir);
        return files;
    }

    async restoreBackup(backupId: string, userId: string): Promise<void> {
        const metadata = this.backups.get(backupId);
        if (!metadata) {
            throw new Error('Backup not found');
        }

        try {
            // Implement restore logic here
            // This would involve extracting the backup and replacing current files

            await auditLogger.log(
                'restore_backup',
                userId,
                'backup',
                backupId,
                { type: metadata.type },
                'system'
            );
        } catch (error) {
            console.error('Restore failed:', error);
            throw error;
        }
    }

    async listBackups(): Promise<BackupMetadata[]> {
        return Array.from(this.backups.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    async deleteBackup(backupId: string, userId: string): Promise<void> {
        const metadata = this.backups.get(backupId);
        if (!metadata) {
            throw new Error('Backup not found');
        }

        try {
            await fs.unlink(path.join(this.backupDir, metadata.path));
            await fs.unlink(path.join(this.backupDir, `${backupId}.meta.json`));
            this.backups.delete(backupId);

            await auditLogger.log(
                'delete_backup',
                userId,
                'backup',
                backupId,
                { type: metadata.type },
                'system'
            );
        } catch (error) {
            console.error('Delete failed:', error);
            throw error;
        }
    }
}

export const backupManager = BackupManager.getInstance();
