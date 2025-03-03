export interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    status: 'draft' | 'published' | 'scheduled';
    publishDate?: Date;
    lastModified: Date;
    author: string;
    version: number;
    revisions: PostRevision[];
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        ogImage?: string;
    };
}

export interface PostRevision {
    id: string;
    postId: string;
    content: string;
    timestamp: Date;
    author: string;
    version: number;
}

export interface MediaItem {
    id: string;
    filename: string;
    path: string;
    type: string;
    size: number;
    width?: number;
    height?: number;
    alt?: string;
    uploadedBy: string;
    uploadedAt: Date;
    optimizedVersions?: {
        thumbnail?: string;
        medium?: string;
        large?: string;
    };
    usedIn?: string[]; // Post IDs where this media is used
}

export interface AuditLogEntry {
    id: string;
    timestamp: Date;
    action: string;
    userId: string;
    resourceType: 'post' | 'media' | 'settings' | 'backup';
    resourceId?: string;
    details: Record<string, any>;
    ipAddress: string;
}

export interface BackupMetadata {
    id: string;
    timestamp: Date;
    type: 'full' | 'content' | 'media';
    size: number;
    createdBy: string;
    status: 'pending' | 'completed' | 'failed';
    path: string;
}
