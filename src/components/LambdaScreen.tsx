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
import {type ServiceScreenProps} from '../types/common.js';
import {type LambdaFunction} from '../types/resources.js';
import {formatBytes, getAwsRegion} from '../utils/aws.js';
import {ResourceListScreen} from './ResourceListScreen.js';

type LambdaScreenProps = ServiceScreenProps<LambdaFunction>;

export const LambdaScreen: FC<LambdaScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [functions, setFunctions] = useState<LambdaFunction[]>(cachedData?.data || []);

    const fetchFunctions = useCallback(async (): Promise<LambdaFunction[]> => {
        const lambdaClient = new LambdaClient({
            region: getAwsRegion(),
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

    const {error, loading} = useCachedResource({
        cachedData,
        fetchData   : fetchFunctions,
        onDataLoaded: (data) => {
            setFunctions(data.data);
            onDataLoaded?.(data);
        },
    });

    const fetchFunctionMetadata = useCallback(async (functionName: string): Promise<void> => {
        // Check if metadata already exists
        const func = functions.find(f => f.name === functionName);
        if (func?.handler !== undefined) return;

        try {
            const lambdaClient = new LambdaClient({
                region: getAwsRegion(),
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

            // Update the function in the list with metadata
            const updatedFunctions = functions.map(f =>
                f.name === functionName
                    ? {...f, architectures, codeSize, environment, handler, lastModified, memorySize, tags, timeout}
                    : f
            );
            setFunctions(updatedFunctions);
            onDataLoaded?.({data: updatedFunctions, error: null, loaded: true});
        } catch {
            // Silently fail metadata fetch
        }
    }, [functions, onDataLoaded]);

    return (
        <ResourceListScreen
            error={error}
            getItemDetails={(func) => ({
                color : 'gray',
                suffix: func.runtime ? ` (${func.runtime})` : undefined,
            })}
            items={functions}
            loading={loading}
            onBack={onBack}
            onItemHovered={(func) => {
                fetchFunctionMetadata(func.name);
            }}
            renderMetadata={(func) => {
                const hasMetadata = func.handler !== undefined;

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
                        {hasMetadata ? (
                            <>
                                {func.handler && (
                                    <Text>
                                        <Text dimColor>Handler: </Text>
                                        {func.handler}
                                    </Text>
                                )}
                                {func.memorySize && (
                                    <Text>
                                        <Text dimColor>Memory: </Text>
                                        {func.memorySize} MB
                                    </Text>
                                )}
                                {func.timeout && (
                                    <Text>
                                        <Text dimColor>Timeout: </Text>
                                        {func.timeout} seconds
                                    </Text>
                                )}
                                {func.codeSize && (
                                    <Text>
                                        <Text dimColor>Code Size: </Text>
                                        {formatBytes(func.codeSize)}
                                    </Text>
                                )}
                                {func.architectures && func.architectures.length > 0 && (
                                    <Text>
                                        <Text dimColor>Architecture: </Text>
                                        {func.architectures.join(', ')}
                                    </Text>
                                )}
                                {func.lastModified && (
                                    <Text>
                                        <Text dimColor>Last Modified: </Text>
                                        {new Date(func.lastModified).toLocaleString()}
                                    </Text>
                                )}
                                {func.environment && Object.keys(func.environment).length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>Environment Variables:</Text>
                                        {Object.entries(func.environment).slice(0, 5).map(([key, value]) => (
                                            <Text key={key}>
                                                {'  '}
                                                <Text color={theme.colors.highlight}>{key}</Text>
                                                {': '}
                                                {String(value).length > 50 ? `${String(value).slice(0, 50)}...` : String(value)}
                                            </Text>
                                        ))}
                                        {Object.keys(func.environment).length > 5 && (
                                            <Text dimColor>
                                                {'  '}
                                                ... and {Object.keys(func.environment).length - 5} more
                                            </Text>
                                        )}
                                    </Box>
                                )}
                                {func.tags && Object.keys(func.tags).length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>Tags:</Text>
                                        {Object.entries(func.tags).map(([key, value]) => (
                                            <Text key={key}>
                                                {'  '}
                                                <Text color={theme.colors.highlight}>{key}</Text>
                                                {': '}
                                                {String(value)}
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
