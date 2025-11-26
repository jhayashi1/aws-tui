import {
    GetFunctionCommand,
    LambdaClient,
    ListFunctionsCommand,
    ListTagsCommand
} from '@aws-sdk/client-lambda';
import {Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {theme} from '../theme.js';
import {ResourceListScreen} from './ResourceListScreen.js';

interface LambdaFunction {
    description?: string;
    id: string;
    name: string;
    runtime?: string;
}

interface LambdaScreenProps {
    cachedData?: {data: LambdaFunction[]; error: null | string; loaded: boolean};
    onBack?: () => void;
    onDataLoaded?: (data: {data: LambdaFunction[]; error: null | string; loaded: boolean}) => void;
}

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export const LambdaScreen: FC<LambdaScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [functionMetadata, setFunctionMetadata] = useState<Record<string, {
        architectures?: string[];
        codeSize?: number;
        environment?: Record<string, string>;
        handler?: string;
        lastModified?: string;
        memorySize?: number;
        tags?: Record<string, string>;
        timeout?: number;
    }>>({});

    const fetchFunctions = useCallback(async (): Promise<LambdaFunction[]> => {
        const lambdaClient = new LambdaClient({
            region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
        });

        const command = new ListFunctionsCommand({});
        const response = await lambdaClient.send(command);
        const functions = response.Functions || [];

        return functions.map((func) => ({
            description: func.Description,
            id         : func.FunctionArn || '',
            name       : func.FunctionName || '',
            runtime    : func.Runtime,
        }));
    }, []);

    const {data: functions, error, loading} = useCachedResource({
        cachedData,
        fetchData: fetchFunctions,
        onDataLoaded,
    });

    const fetchFunctionMetadata = useCallback(async (functionName: string): Promise<void> => {
        if (functionMetadata[functionName]) return;

        try {
            const lambdaClient = new LambdaClient({
                region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
            });

            const [functionResponse, tagsResponse] = await Promise.allSettled([
                lambdaClient.send(new GetFunctionCommand({FunctionName: functionName})),
                lambdaClient.send(new ListTagsCommand({Resource: functionName})),
            ]);

            let architectures: string[] | undefined;
            let codeSize: number | undefined;
            let environment: Record<string, string> | undefined;
            let handler: string | undefined;
            let lastModified: string | undefined;
            let memorySize: number | undefined;
            let timeout: number | undefined;

            if (functionResponse.status === 'fulfilled') {
                const config = functionResponse.value.Configuration;
                if (config) {
                    architectures = config.Architectures;
                    codeSize = config.CodeSize;
                    environment = config.Environment?.Variables;
                    handler = config.Handler;
                    lastModified = config.LastModified;
                    memorySize = config.MemorySize;
                    timeout = config.Timeout;
                }
            }

            const tags = tagsResponse.status === 'fulfilled'
                ? tagsResponse.value.Tags
                : undefined;

            setFunctionMetadata(prev => ({
                ...prev,
                [functionName]: {
                    architectures,
                    codeSize,
                    environment,
                    handler,
                    lastModified,
                    memorySize,
                    tags,
                    timeout,
                },
            }));
        } catch {
            // Silently fail metadata fetch
        }
    }, [functionMetadata]);

    return (
        <ResourceListScreen
            error={error}
            items={functions}
            loading={loading}
            onBack={onBack}
            renderItem={(func, isSelected) => {
                if (isSelected) {
                    fetchFunctionMetadata(func.name);
                }

                return (
                    <Text
                        bold={isSelected}
                        color={isSelected ? theme.colors.highlight : theme.colors.text}
                    >
                        {isSelected ? '❯ ' : '  '}
                        {func.name}
                        {func.runtime && (
                            <Text dimColor>
                                {' '}
                                ({func.runtime})
                            </Text>
                        )}
                    </Text>
                );
            }}
            renderMetadata={(func) => {
                const metadata = functionMetadata[func.name];

                return (
                    <Box flexDirection='column'>
                        <Text>
                            <Text dimColor>Name: </Text>
                            {func.name}
                        </Text>
                        {func.description && (
                            <Text>
                                <Text dimColor>Description: </Text>
                                {func.description}
                            </Text>
                        )}
                        {func.runtime && (
                            <Text>
                                <Text dimColor>Runtime: </Text>
                                {func.runtime}
                            </Text>
                        )}
                        {metadata ? (
                            <>
                                {metadata.handler && (
                                    <Text>
                                        <Text dimColor>Handler: </Text>
                                        {metadata.handler}
                                    </Text>
                                )}
                                {metadata.memorySize && (
                                    <Text>
                                        <Text dimColor>Memory: </Text>
                                        {metadata.memorySize} MB
                                    </Text>
                                )}
                                {metadata.timeout && (
                                    <Text>
                                        <Text dimColor>Timeout: </Text>
                                        {metadata.timeout} seconds
                                    </Text>
                                )}
                                {metadata.codeSize && (
                                    <Text>
                                        <Text dimColor>Code Size: </Text>
                                        {formatBytes(metadata.codeSize)}
                                    </Text>
                                )}
                                {metadata.architectures && metadata.architectures.length > 0 && (
                                    <Text>
                                        <Text dimColor>Architecture: </Text>
                                        {metadata.architectures.join(', ')}
                                    </Text>
                                )}
                                {metadata.lastModified && (
                                    <Text>
                                        <Text dimColor>Last Modified: </Text>
                                        {new Date(metadata.lastModified).toLocaleString()}
                                    </Text>
                                )}
                                {metadata.environment && Object.keys(metadata.environment).length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>Environment Variables:</Text>
                                        {Object.entries(metadata.environment).slice(0, 5).map(([key, value]) => (
                                            <Text key={key}>
                                                {'  '}
                                                <Text color={theme.colors.highlight}>{key}</Text>
                                                {': '}
                                                {value.length > 50 ? `${value.slice(0, 50)}...` : value}
                                            </Text>
                                        ))}
                                        {Object.keys(metadata.environment).length > 5 && (
                                            <Text dimColor>
                                                {'  '}
                                                ... and {Object.keys(metadata.environment).length - 5} more
                                            </Text>
                                        )}
                                    </Box>
                                )}
                                {metadata.tags && Object.keys(metadata.tags).length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>Tags:</Text>
                                        {Object.entries(metadata.tags).map(([key, value]) => (
                                            <Text key={key}>
                                                {'  '}
                                                <Text color={theme.colors.highlight}>{key}</Text>
                                                {': '}
                                                {value}
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
            title='Lambda Functions'
        />
    );
};
