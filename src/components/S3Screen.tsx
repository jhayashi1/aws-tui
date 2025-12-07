import {
    GetBucketLocationCommand,
    GetBucketTaggingCommand,
    GetBucketVersioningCommand,
    ListBucketsCommand,
    ListObjectsV2Command,
    S3Client
} from '@aws-sdk/client-s3';
import {Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {useMetadataFetch} from '../hooks/useMetadataFetch.js';
import {theme} from '../theme.js';
import {type ServiceScreenProps} from '../types/common.js';
import {type S3Bucket} from '../types/resources.js';
import {formatBytes, getAwsRegion} from '../utils/aws.js';
import {ResourceListScreen} from './ResourceListScreen.js';

interface Bucket {
    CreationDate?: Date;
    Name?: string;
}

type S3ScreenProps = ServiceScreenProps<S3Bucket>;

export const S3Screen: FC<S3ScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [buckets, setBuckets] = useState<S3Bucket[]>(cachedData?.data || []);
    const {scheduleFetch} = useMetadataFetch();

    const fetchBuckets = useCallback(async (): Promise<S3Bucket[]> => {
        const s3Client = new S3Client({
            region: getAwsRegion(),
        });

        // ListBuckets doesn't support pagination - it returns all buckets
        const command = new ListBucketsCommand({});
        const response = await s3Client.send(command);
        const buckets = response.Buckets || [];

        return buckets.map((bucket: Bucket) => ({
            creationDate: bucket.CreationDate,
            id          : bucket.Name || '',
            name        : bucket.Name || '',
        }));
    }, []);

    const {error, loading} = useCachedResource({
        cachedData,
        fetchData   : fetchBuckets,
        onDataLoaded: (data) => {
            setBuckets(data.data);
            onDataLoaded?.(data);
        },
    });

    const fetchBucketMetadata = useCallback(async (bucketName: string): Promise<void> => {
        // Check if metadata already exists
        const bucket = buckets.find(b => b.name === bucketName);
        if (bucket?.location !== undefined) return;

        try {
            const s3Client = new S3Client({
                region: getAwsRegion(),
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

            // Update the bucket in the list with metadata
            const updatedBuckets = buckets.map(b =>
                b.name === bucketName
                    ? {...b, location, objectCount, tags, totalSize, versioning}
                    : b
            );
            setBuckets(updatedBuckets);
            onDataLoaded?.({data: updatedBuckets, error: null, loaded: true});
        } catch {
            // Silently fail metadata fetch
        }
    }, [buckets, onDataLoaded]);

    return (
        <ResourceListScreen
            error={error}
            items={buckets}
            loading={loading}
            onBack={onBack}
            onItemHovered={(bucket) => {
                scheduleFetch(() => fetchBucketMetadata(bucket.name));
            }}
            renderMetadata={(bucket) => {
                const hasMetadata = bucket.location !== undefined;

                return (
                    <Box flexDirection='column'>
                        <Text>
                            <Text dimColor>{'Name: '}</Text>
                            {bucket.name}
                        </Text>
                        {bucket.creationDate && (
                            <Text>
                                <Text dimColor>{'Created: '}</Text>
                                {bucket.creationDate.toLocaleString()}
                            </Text>
                        )}
                        {hasMetadata ? (
                            <>
                                <Text>
                                    <Text dimColor>{'Region: '}</Text>
                                    {bucket.location}
                                </Text>
                                <Text>
                                    <Text dimColor>{'Versioning: '}</Text>
                                    {bucket.versioning}
                                </Text>
                                <Text>
                                    <Text dimColor>{'Objects: '}</Text>
                                    {bucket.objectCount !== undefined ? bucket.objectCount.toLocaleString() : 'Unknown'}
                                </Text>
                                <Text>
                                    <Text dimColor>{'Size: '}</Text>
                                    {bucket.totalSize !== undefined ? formatBytes(bucket.totalSize) : 'Unknown'}
                                </Text>
                                {bucket.tags && bucket.tags.length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>{'Tags:'}</Text>
                                        {bucket.tags.map((tag) => (
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
