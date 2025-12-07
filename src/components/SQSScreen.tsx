import {
    GetQueueAttributesCommand,
    ListQueuesCommand,
    ListQueueTagsCommand,
    SQSClient
} from '@aws-sdk/client-sqs';
import {Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {useMetadataFetch} from '../hooks/useMetadataFetch.js';
import {theme} from '../theme.js';
import {type ServiceScreenProps} from '../types/common.js';
import {type SQSQueue} from '../types/resources.js';
import {getAwsRegion} from '../utils/aws.js';
import {ResourceListScreen} from './ResourceListScreen.js';

type SQSScreenProps = ServiceScreenProps<SQSQueue>;

export const SQSScreen: FC<SQSScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [queues, setQueues] = useState<SQSQueue[]>(cachedData?.data || []);
    const {scheduleFetch} = useMetadataFetch();

    const fetchQueues = useCallback(async (): Promise<SQSQueue[]> => {
        const sqsClient = new SQSClient({
            region: getAwsRegion(),
        });

        const allQueueUrls = [];
        let nextToken: string | undefined;

        do {
            const command = new ListQueuesCommand({NextToken: nextToken});
            const response = await sqsClient.send(command);
            const queueUrls = response.QueueUrls || [];
            allQueueUrls.push(...queueUrls);
            nextToken = response.NextToken;
        } while (nextToken);

        return allQueueUrls.map((queueUrl) => {
            const name = queueUrl.split('/').pop() || 'unknown';
            return {
                id: queueUrl,
                name,
            };
        });
    }, []);

    const {error, loading} = useCachedResource({
        cachedData,
        fetchData   : fetchQueues,
        onDataLoaded: (data) => {
            setQueues(data.data);
            onDataLoaded?.(data);
        },
    });

    const fetchQueueMetadata = useCallback(async (queueUrl: string): Promise<void> => {
        const queue = queues.find(q => q.id === queueUrl);
        if (queue?.queueArn !== undefined) return;

        try {
            const sqsClient = new SQSClient({
                region: getAwsRegion(),
            });

            // Fetch queue attributes
            const attrsResponse = await sqsClient.send(
                new GetQueueAttributesCommand({
                    AttributeNames: ['All'],
                    QueueUrl      : queueUrl,
                })
            );

            const attributes = attrsResponse.Attributes || {};

            // Fetch tags
            let tags: Array<{Key?: string; Value?: string}> = [];
            try {
                const tagsResponse = await sqsClient.send(
                    new ListQueueTagsCommand({QueueUrl: queueUrl})
                );
                const tagsMap = tagsResponse.Tags || {};
                tags = Object.entries(tagsMap).map(([Key, Value]) => ({Key, Value}));
            } catch {
                // Tags may not be accessible
            }

            const updatedQueues = queues.map(q =>
                q.id === queueUrl
                    ? {
                        ...q,
                        approximateMessages          : parseInt(attributes.ApproximateNumberOfMessages || '0', 10),
                        approximateMessagesDelayed   : parseInt(attributes.ApproximateNumberOfMessagesDelayed || '0', 10),
                        approximateMessagesNotVisible: parseInt(attributes.ApproximateNumberOfMessagesNotVisible || '0', 10),
                        createdTimestamp             : attributes.CreatedTimestamp ? new Date(parseInt(attributes.CreatedTimestamp, 10) * 1000) : undefined,
                        delaySeconds                 : parseInt(attributes.DelaySeconds || '0', 10),
                        lastModifiedTimestamp        : attributes.LastModifiedTimestamp ? new Date(parseInt(attributes.LastModifiedTimestamp, 10) * 1000) : undefined,
                        maxMessageSize               : parseInt(attributes.MaximumMessageSize || '0', 10),
                        messageRetentionPeriod       : parseInt(attributes.MessageRetentionPeriod || '0', 10),
                        queueArn                     : attributes.QueueArn,
                        tags,
                        visibilityTimeout            : parseInt(attributes.VisibilityTimeout || '0', 10),
                    }
                    : q
            );
            setQueues(updatedQueues);
            onDataLoaded?.({data: updatedQueues, error: null, loaded: true});
        } catch {
            // Silently fail metadata fetch
        }
    }, [queues, onDataLoaded]);

    return (
        <ResourceListScreen
            error={error}
            items={queues}
            loading={loading}
            onBack={onBack}
            onItemHovered={(queue) => {
                scheduleFetch(() => fetchQueueMetadata(queue.id));
            }}
            renderMetadata={(queue) => {
                const hasMetadata = queue.queueArn !== undefined;

                return (
                    <Box flexDirection='column'>
                        <Text>
                            <Text dimColor>{'Queue Name: '}</Text>
                            {queue.name}
                        </Text>
                        {hasMetadata ? (
                            <>
                                {queue.queueArn && (
                                    <Text>
                                        <Text dimColor>{'ARN: '}</Text>
                                        {queue.queueArn}
                                    </Text>
                                )}
                                {queue.approximateMessages !== undefined && (
                                    <Text>
                                        <Text dimColor>{'Messages Available: '}</Text>
                                        {queue.approximateMessages}
                                    </Text>
                                )}
                                {queue.approximateMessagesNotVisible !== undefined && (
                                    <Text>
                                        <Text dimColor>{'Messages In Flight: '}</Text>
                                        {queue.approximateMessagesNotVisible}
                                    </Text>
                                )}
                                {queue.approximateMessagesDelayed !== undefined && (
                                    <Text>
                                        <Text dimColor>{'Messages Delayed: '}</Text>
                                        {queue.approximateMessagesDelayed}
                                    </Text>
                                )}
                                {queue.visibilityTimeout !== undefined && (
                                    <Text>
                                        <Text dimColor>{'Visibility Timeout: '}</Text>
                                        {queue.visibilityTimeout}{'s'}
                                    </Text>
                                )}
                                {queue.messageRetentionPeriod !== undefined && (
                                    <Text>
                                        <Text dimColor>{'Retention Period: '}</Text>
                                        {Math.floor(queue.messageRetentionPeriod / 86400)}{' days'}
                                    </Text>
                                )}
                                {queue.maxMessageSize !== undefined && (
                                    <Text>
                                        <Text dimColor>{'Max Message Size: '}</Text>
                                        {queue.maxMessageSize}{' bytes'}
                                    </Text>
                                )}
                                {queue.delaySeconds !== undefined && (
                                    <Text>
                                        <Text dimColor>{'Delivery Delay: '}</Text>
                                        {queue.delaySeconds}{'s'}
                                    </Text>
                                )}
                                {queue.createdTimestamp && (
                                    <Text>
                                        <Text dimColor>{'Created: '}</Text>
                                        {queue.createdTimestamp.toLocaleString()}
                                    </Text>
                                )}
                                {queue.tags && queue.tags.length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>{'Tags:'}</Text>
                                        {queue.tags.map((tag) => (
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
            title='SQS Queues'
        />
    );
};
