import {
    DescribeTableCommand,
    DynamoDBClient,
    ListTablesCommand,
    ListTagsOfResourceCommand
} from '@aws-sdk/client-dynamodb';
import {Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {theme} from '../theme.js';
import {type ServiceScreenProps} from '../types/common.js';
import {type DynamoDBTable} from '../types/resources.js';
import {formatBytes, getAwsRegion} from '../utils/aws.js';
import {ResourceListScreen} from './ResourceListScreen.js';

type DynamoDBScreenProps = ServiceScreenProps<DynamoDBTable>;

export const DynamoDBScreen: FC<DynamoDBScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [tables, setTables] = useState<DynamoDBTable[]>(cachedData?.data || []);

    const fetchTables = useCallback(async (): Promise<DynamoDBTable[]> => {
        const dynamoClient = new DynamoDBClient({
            region: getAwsRegion(),
        });

        const command = new ListTablesCommand({});
        const response = await dynamoClient.send(command);
        const tableNames = response.TableNames || [];

        return tableNames.map((tableName) => ({
            id  : tableName,
            name: tableName,
        }));
    }, []);

    const {error, loading} = useCachedResource({
        cachedData,
        fetchData   : fetchTables,
        onDataLoaded: (data) => {
            setTables(data.data);
            onDataLoaded?.(data);
        },
    });

    const fetchTableMetadata = useCallback(async (tableName: string): Promise<void> => {
        // Check if metadata already exists
        const table = tables.find(t => t.name === tableName);
        if (table?.status !== undefined) return;

        try {
            const dynamoClient = new DynamoDBClient({
                region: getAwsRegion(),
            });

            const describeResponse = await dynamoClient.send(
                new DescribeTableCommand({TableName: tableName})
            );

            const tableDescription = describeResponse.Table;
            if (!tableDescription) return;

            // Fetch tags
            let tags: Array<{Key?: string; Value?: string}> = [];
            if (tableDescription.TableArn) {
                try {
                    const tagsResponse = await dynamoClient.send(
                        new ListTagsOfResourceCommand({ResourceArn: tableDescription.TableArn})
                    );
                    tags = tagsResponse.Tags || [];
                } catch {
                    // Tags may not be accessible
                }
            }

            const updatedTables = tables.map(t =>
                t.name === tableName
                    ? {
                        ...t,
                        billingMode  : tableDescription.BillingModeSummary?.BillingMode || 'PROVISIONED',
                        creationDate : tableDescription.CreationDateTime,
                        itemCount    : tableDescription.ItemCount,
                        readCapacity : tableDescription.ProvisionedThroughput?.ReadCapacityUnits,
                        status       : tableDescription.TableStatus,
                        tableSize    : tableDescription.TableSizeBytes,
                        tags,
                        writeCapacity: tableDescription.ProvisionedThroughput?.WriteCapacityUnits,
                    }
                    : t
            );
            setTables(updatedTables);
            onDataLoaded?.({data: updatedTables, error: null, loaded: true});
        } catch {
            // Silently fail metadata fetch
        }
    }, [tables, onDataLoaded]);

    return (
        <ResourceListScreen
            error={error}
            items={tables}
            loading={loading}
            onBack={onBack}
            onItemHovered={(table) => {
                fetchTableMetadata(table.name);
            }}
            renderMetadata={(table) => {
                const hasMetadata = table.status !== undefined;

                return (
                    <Box flexDirection='column'>
                        <Text>
                            <Text dimColor>Table Name: </Text>
                            {table.name}
                        </Text>
                        {hasMetadata ? (
                            <>
                                <Text>
                                    <Text dimColor>Status: </Text>
                                    {table.status}
                                </Text>
                                {table.billingMode && (
                                    <Text>
                                        <Text dimColor>Billing Mode: </Text>
                                        {table.billingMode}
                                    </Text>
                                )}
                                {table.itemCount !== undefined && (
                                    <Text>
                                        <Text dimColor>Item Count: </Text>
                                        {table.itemCount.toLocaleString()}
                                    </Text>
                                )}
                                {table.tableSize !== undefined && (
                                    <Text>
                                        <Text dimColor>Table Size: </Text>
                                        {formatBytes(table.tableSize)}
                                    </Text>
                                )}
                                {table.readCapacity !== undefined && (
                                    <Text>
                                        <Text dimColor>Read Capacity: </Text>
                                        {table.readCapacity} units
                                    </Text>
                                )}
                                {table.writeCapacity !== undefined && (
                                    <Text>
                                        <Text dimColor>Write Capacity: </Text>
                                        {table.writeCapacity} units
                                    </Text>
                                )}
                                {table.creationDate && (
                                    <Text>
                                        <Text dimColor>Created: </Text>
                                        {table.creationDate.toLocaleString()}
                                    </Text>
                                )}
                                {table.tags && table.tags.length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>Tags:</Text>
                                        {table.tags.map((tag) => (
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
            title='DynamoDB Tables'
        />
    );
};
