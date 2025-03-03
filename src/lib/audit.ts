import type { AuditLogEntry } from './types';

class AuditLogger {
    private static instance: AuditLogger;
    private logQueue: AuditLogEntry[] = [];

    private constructor() {
        // Initialize with a periodic flush
        setInterval(() => this.flush(), 60000); // Flush every minute
    }

    public static getInstance(): AuditLogger {
        if (!AuditLogger.instance) {
            AuditLogger.instance = new AuditLogger();
        }
        return AuditLogger.instance;
    }

    async log(
        action: string,
        userId: string,
        resourceType: AuditLogEntry['resourceType'],
        resourceId: string | undefined,
        details: Record<string, any>,
        ipAddress: string
    ): Promise<void> {
        const entry: AuditLogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            action,
            userId,
            resourceType,
            resourceId,
            details,
            ipAddress
        };

        this.logQueue.push(entry);

        // If queue gets too large, flush immediately
        if (this.logQueue.length >= 100) {
            await this.flush();
        }
    }

    private async flush(): Promise<void> {
        if (this.logQueue.length === 0) return;

        try {
            // Here you would implement the actual storage logic
            // For example, writing to a database or file
            const entries = [...this.logQueue];
            this.logQueue = [];
            
            // Example storage call:
            // await db.auditLog.createMany({ data: entries });
            
            console.log(`Flushed ${entries.length} audit log entries`);
        } catch (error) {
            console.error('Failed to flush audit log:', error);
            // Retry failed entries
            this.logQueue = [...this.logQueue];
        }
    }

    async query(options: {
        startDate?: Date;
        endDate?: Date;
        userId?: string;
        resourceType?: AuditLogEntry['resourceType'];
        resourceId?: string;
        action?: string;
        limit?: number;
        offset?: number;
    }): Promise<AuditLogEntry[]> {
        // Implement query logic here
        // This would typically query your database
        return [];
    }
}

export const auditLogger = AuditLogger.getInstance();

// Middleware to automatically log API requests
export async function auditMiddleware(context: any) {
    const { request, user } = context;
    
    // Extract relevant information
    const action = request.method;
    const resourceType = request.url.pathname.split('/')[1] as AuditLogEntry['resourceType'];
    const resourceId = request.url.pathname.split('/')[2];
    
    await auditLogger.log(
        action,
        user?.id || 'anonymous',
        resourceType,
        resourceId,
        {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers)
        },
        request.headers.get('x-forwarded-for') || 'unknown'
    );
}
