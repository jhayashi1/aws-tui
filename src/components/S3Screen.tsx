import {ListBucketsCommand, S3Client} from '@aws-sdk/client-s3';
import {Spinner} from '@inkjs/ui';
import {Box, Text, useInput} from 'ink';
import React, {type FC, useEffect, useState} from 'react';

import {theme} from '../theme.js';

interface Bucket {
    CreationDate?: Date;
    Name?: string;
}

interface S3ScreenProps {
    cachedData?: {buckets: Bucket[]; error: null | string; loaded: boolean};
    onBack?: () => void;
    onDataLoaded?: (data: {buckets: Bucket[]; error: null | string; loaded: boolean}) => void;
}

export const S3Screen: FC<S3ScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [buckets, setBuckets] = useState<Bucket[]>(cachedData?.buckets || []);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(!cachedData?.loaded);
    const [error, setError] = useState<null | string>(cachedData?.error || null);

    useEffect(() => {
        // Skip fetch if we have cached data
        if (cachedData?.loaded) {
            return;
        }

        const s3Client = new S3Client({
            region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
        });

        const fetchBuckets = async (): Promise<void> => {
            try {
                const command = new ListBucketsCommand({});
                const response = await s3Client.send(command);
                const newBuckets = response.Buckets || [];
                setBuckets(newBuckets);
                if (onDataLoaded) {
                    onDataLoaded({buckets: newBuckets, error: null, loaded: true});
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMsg);
                if (onDataLoaded) {
                    onDataLoaded({buckets: [], error: errorMsg, loaded: true});
                }
            } finally {
                setLoading(false);
            }
        };

        fetchBuckets();
    }, [cachedData?.loaded, onDataLoaded]);

    useInput((input, key) => {
        if (key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setSelectedIndex(prev => Math.min(buckets.length - 1, prev + 1));
        } else if (key.escape || (key.ctrl && input === 'c')) {
            if (onBack) {
                onBack();
            } else {
                process.exit(0);
            }
        } else if (input === 'b' || input === 'B') {
            if (onBack) {
                onBack();
            }
        }
    });

    if (loading) {
        return (
            <Box
                flexDirection='column'
                paddingX={2}
                paddingY={1}
            >
                <Box>
                    <Spinner label='Loading S3 buckets...' />
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                flexDirection='column'
                paddingX={2}
                paddingY={1}
            >
                <Text color='red'>Error: {error}</Text>
                <Box marginTop={1}>
                    <Text dimColor>Press B to go back | Esc to exit</Text>
                </Box>
            </Box>
        );
    }

    return (
        <Box
            flexDirection='column'
            paddingX={2}
            paddingY={1}
        >
            <Box
                justifyContent='center'
                marginBottom={1}
            >
                <Text
                    bold
                    color={theme.colors.primary}
                >
                    S3 Buckets ({buckets.length})
                </Text>
            </Box>

            <Box flexDirection='column'>
                {buckets.length > 0 ? (
                    buckets.map((bucket, index) => (
                        <Box
                            key={bucket.Name}
                            marginY={0}
                        >
                            <Text
                                bold={index === selectedIndex}
                                color={
                                    index === selectedIndex
                                        ? theme.colors.highlight
                                        : theme.colors.text
                                }
                            >
                                {index === selectedIndex ? '❯ ' : '  '}
                                {bucket.Name}
                                {bucket.CreationDate && (
                                    <Text dimColor>
                                        {' '}
                                        - Created: {bucket.CreationDate.toLocaleDateString()}
                                    </Text>
                                )}
                            </Text>
                        </Box>
                    ))
                ) : (
                    <Text dimColor>No S3 buckets found</Text>
                )}
            </Box>

            <Box marginTop={1}>
                <Text dimColor>↑↓ Navigate | B: Back | Esc: Exit</Text>
            </Box>
        </Box>
    );
};
