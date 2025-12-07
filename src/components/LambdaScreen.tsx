import {
    GetFunctionCommand,
    LambdaClient,
    ListFunctionsCommand,
    ListTagsCommand
} from '@aws-sdk/client-lambda';
import {Spinner} from '@inkjs/ui';
import {Box} from 'ink';
import {type FC, useCallback, useMemo, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {useMetadataFetch} from '../hooks/useMetadataFetch.js';
import {type ServiceScreenProps} from '../types/common.js';
import {type LambdaFunction} from '../types/resources.js';
import {formatBytes, getAwsRegion} from '../utils/aws.js';
import {KeyValueList, type MetadataConfig, renderMetadata} from '../utils/metadata.js';
import {ResourceListScreen} from './ResourceListScreen.js';

type LambdaScreenProps = ServiceScreenProps<LambdaFunction>;

export const LambdaScreen: FC<LambdaScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [functions, setFunctions] = useState<LambdaFunction[]>(cachedData?.data || []);
    const {scheduleFetch} = useMetadataFetch();

    const metadataConfig: MetadataConfig<LambdaFunction> = useMemo(() => ({
        fields: [
            {
                getValue: (func) => func.name,
                label   : 'Name: ',
            },
            {
                condition: (func) => !!func.description,
                getValue : (func) => func.description,
                label    : 'Description: ',
            },
            {
                condition: (func) => !!func.runtime,
                getValue : (func) => func.runtime,
                label    : 'Runtime: ',
            },
            {
                condition: (func) => !!func.handler,
                getValue : (func) => func.handler,
                label    : 'Handler: ',
            },
            {
                condition: (func) => !!func.memorySize,
                format   : (value) => `${value} MB`,
                getValue : (func) => func.memorySize,
                label    : 'Memory: ',
            },
            {
                condition: (func) => !!func.timeout,
                format   : (value) => `${value} seconds`,
                getValue : (func) => func.timeout,
                label    : 'Timeout: ',
            },
            {
                condition: (func) => !!func.codeSize,
                format   : (value) => formatBytes(value as number),
                getValue : (func) => func.codeSize,
                label    : 'Code Size: ',
            },
            {
                condition: (func) => !!func.architectures && func.architectures.length > 0,
                format   : (value) => (value as string[]).join(', '),
                getValue : (func) => func.architectures,
                label    : 'Architecture: ',
            },
            {
                condition: (func) => !!func.lastModified,
                format   : (value) => new Date(value as string).toLocaleString(),
                getValue : (func) => func.lastModified,
                label    : 'Last Modified: ',
            },
        ],
    }), []);

    const fetchFunctions = useCallback(async (): Promise<LambdaFunction[]> => {
        const lambdaClient = new LambdaClient({
            region: getAwsRegion(),
        });

        const allFunctions = [];
        let marker: string | undefined;

        do {
            const command = new ListFunctionsCommand({Marker: marker});
            const response = await lambdaClient.send(command);
            const functions = response.Functions || [];
            allFunctions.push(...functions);
            marker = response.NextMarker;
        } while (marker);

        return allFunctions.map((func) => ({
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
                scheduleFetch(async () => await fetchFunctionMetadata(func.name));
            }}
            renderMetadata={(func) => {
                const hasMetadata = func.handler !== undefined;

                return (
                    <Box flexDirection='column'>
                        {renderMetadata({config: metadataConfig, item: func})}
                        {hasMetadata ? (
                            <>
                                {func.environment && Object.keys(func.environment).length > 0 && (
                                    <KeyValueList
                                        items={func.environment}
                                        label='Environment Variables:'
                                        maxDisplay={5}
                                    />
                                )}
                                {func.tags && Object.keys(func.tags).length > 0 && (
                                    <KeyValueList
                                        items={func.tags}
                                        label='Tags:'
                                    />
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
