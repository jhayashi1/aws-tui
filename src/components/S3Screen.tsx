import {
    GetBucketLocationCommand,
    GetBucketTaggingCommand,
    GetBucketVersioningCommand,
    ListBucketsCommand,
    ListObjectsV2Command,
    S3Client,
    type Tag
} from '@aws-sdk/client-s3';
import {Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {theme} from '../theme.js';
import {ResourceListScreen} from './ResourceListScreen.js';

interface Bucket {
    CreationDate?: Date;
    Name?: string;
}

interface S3Bucket {
    creationDate?: Date;
    id: string;
    location?: string;
    metadata?: string;
    name: string;
    versioning?: string;
}

interface S3ScreenProps {
    cachedData?: {data: S3Bucket[]; error: null | string; loaded: boolean};
    onBack?: () => void;
    onDataLoaded?: (data: {data: S3Bucket[]; error: null | string; loaded: boolean}) => void;
}

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export const S3Screen: FC<S3ScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [bucketMetadata, setBucketMetadata] = useState<Record<string, {location?: string; objectCount?: number; tags?: Tag[]; totalSize?: number; versioning?: string}>>({});

    const fetchBuckets = useCallback(async (): Promise<S3Bucket[]> => {
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
        });

        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        const buckets = response.Buckets || [];

        return buckets.map((bucket: Bucket) => ({
            creationDate: bucket.CreationDate,
            id          : bucket.Name || '',
            name        : bucket.Name || '',
        }));
    }, []);

    const {data: buckets, error, loading} = useCachedResource({
        cachedData,
        fetchData: fetchBuckets,
        onDataLoaded,
    });

    const fetchBucketMetadata = useCallback(async (bucketName: string): Promise<void> => {
        if (bucketMetadata[bucketName]) return;

        try {
            const s3Client = new S3Client({
                region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
            });

            const [locationResponse, versioningResponse, objectsResponse, taggingResponse] = await Promise.allSettled([
                s3Client.send(new GetBucketLocationCommand({Bucket: bucketName})),
                s3Client.send(new GetBucketVersioningCommand({Bucket: bucketName})),
                s3Client.send(new ListObjectsV2Command({Bucket: bucketName, MaxKeys: 1000})),
                s3Client.send(new GetBucketTaggingCommand({Bucket: bucketName})),
            ]);

            const location = locationResponse.status === 'fulfilled'
                ? locationResponse.value.LocationConstraint || 'us-east-1'
                : 'Unknown';

            const versioning = versioningResponse.status === 'fulfilled'
                ? versioningResponse.value.Status || 'Disabled'
                : 'Unknown';

            let objectCount = 0;
            let totalSize = 0;

            if (objectsResponse.status === 'fulfilled') {
                const contents = objectsResponse.value.Contents || [];
                objectCount = objectsResponse.value.KeyCount || contents.length;
                totalSize = contents.reduce((sum, obj) => sum + (obj.Size || 0), 0);
            }

            const tags = taggingResponse.status === 'fulfilled'
                ? taggingResponse.value.TagSet || []
                : [];

            setBucketMetadata(prev => ({
                ...prev,
                [bucketName]: {location, objectCount, tags, totalSize, versioning},
            }));
        } catch {
            // Silently fail metadata fetch
        }
    }, [bucketMetadata]);

    return (
        <ResourceListScreen
            error={error}
            items={buckets}
            loading={loading}
            onBack={onBack}
            renderItem={(bucket, isSelected) => {
                if (isSelected) {
                    fetchBucketMetadata(bucket.name);
                }

                return (
                    <Text
                        bold={isSelected}
                        color={isSelected ? theme.colors.highlight : theme.colors.text}
                    >
                        {isSelected ? '❯ ' : '  '}
                        {bucket.name}
                    </Text>
                );
            }}
            renderMetadata={(bucket) => {
                const metadata = bucketMetadata[bucket.name];

                return (
                    <Box flexDirection='column'>
                        <Text>
                            <Text dimColor>Name: </Text>
                            {bucket.name}
                        </Text>
                        {bucket.creationDate && (
                            <Text>
                                <Text dimColor>Created: </Text>
                                {bucket.creationDate.toLocaleString()}
                            </Text>
                        )}
                        {metadata ? (
                            <>
                                <Text>
                                    <Text dimColor>Region: </Text>
                                    {metadata.location}
                                </Text>
                                <Text>
                                    <Text dimColor>Versioning: </Text>
                                    {metadata.versioning}
                                </Text>
                                <Text>
                                    <Text dimColor>Objects: </Text>
                                    {metadata.objectCount !== undefined ? metadata.objectCount.toLocaleString() : 'Unknown'}
                                </Text>
                                <Text>
                                    <Text dimColor>Size: </Text>
                                    {metadata.totalSize !== undefined ? formatBytes(metadata.totalSize) : 'Unknown'}
                                </Text>
                                {metadata.tags && metadata.tags.length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>Tags:</Text>
                                        {metadata.tags.map((tag) => (
                                            <Text key={tag.Key}>
                                                {'  '}
                                                <Text color={theme.colors.highlight}>{tag.Key}</Text>
                                                {': '}
                                                {tag.Value}
                                            </Text>
                                        ))}
                                    </Box>
                                )}
                            </>
                        ) : (
                            <Spinner label='Loading metadata...' />
                        )}
                    </Box>
                );
            }}
            title='S3 Buckets'
        />
    );
};
