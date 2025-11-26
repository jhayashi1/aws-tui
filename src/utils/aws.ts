/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * Get AWS region from environment variables with fallback
 */
export const getAwsRegion = (): string => {
    return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
};
