import {
    GetTopicAttributesCommand,
    ListTagsForResourceCommand,
    ListTopicsCommand,
    SNSClient
} from '@aws-sdk/client-sns';
import {Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {useMetadataFetch} from '../hooks/useMetadataFetch.js';
import {theme} from '../theme.js';
import {type ServiceScreenProps} from '../types/common.js';
import {type SNSTopic} from '../types/resources.js';
import {getAwsRegion} from '../utils/aws.js';
import {ResourceListScreen} from './ResourceListScreen.js';

type SNSScreenProps = ServiceScreenProps<SNSTopic>;

export const SNSScreen: FC<SNSScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [topics, setTopics] = useState<SNSTopic[]>(cachedData?.data || []);
    const {scheduleFetch} = useMetadataFetch();

    const fetchTopics = useCallback(async (): Promise<SNSTopic[]> => {
        const snsClient = new SNSClient({
            region: getAwsRegion(),
        });

        const allTopics = [];
        let nextToken: string | undefined;

        do {
            const command = new ListTopicsCommand({NextToken: nextToken});
            const response = await snsClient.send(command);
            const topicArns = response.Topics || [];
            allTopics.push(...topicArns);
            nextToken = response.NextToken;
        } while (nextToken);

        return allTopics.map((topic) => {
            const arn = topic.TopicArn || '';
            const name = arn.split(':').pop() || 'unknown';
            return {
                arn,
                id: arn,
                name,
            };
        });
    }, []);

    const {error, loading} = useCachedResource({
        cachedData,
        fetchData   : fetchTopics,
        onDataLoaded: (data) => {
            setTopics(data.data);
            onDataLoaded?.(data);
        },
    });

    const fetchTopicMetadata = useCallback(async (topicArn: string): Promise<void> => {
        const topic = topics.find(t => t.arn === topicArn);
        if (topic?.displayName !== undefined) return;

        try {
            const snsClient = new SNSClient({
                region: getAwsRegion(),
            });

            // Fetch topic attributes
            const attrsResponse = await snsClient.send(
                new GetTopicAttributesCommand({TopicArn: topicArn})
            );

            const attributes = attrsResponse.Attributes || {};

            // Fetch tags
            let tags: Array<{Key?: string; Value?: string}> = [];
            try {
                const tagsResponse = await snsClient.send(
                    new ListTagsForResourceCommand({ResourceArn: topicArn})
                );
                tags = tagsResponse.Tags || [];
            } catch {
                // Tags may not be accessible
            }

            const updatedTopics = topics.map(t =>
                t.arn === topicArn
                    ? {
                        ...t,
                        displayName           : attributes.DisplayName,
                        owner                 : attributes.Owner,
                        policy                : attributes.Policy,
                        subscriptionsConfirmed: parseInt(attributes.SubscriptionsConfirmed || '0', 10),
                        subscriptionsDeleted  : parseInt(attributes.SubscriptionsDeleted || '0', 10),
                        subscriptionsPending  : parseInt(attributes.SubscriptionsPending || '0', 10),
                        tags,
                    }
                    : t
            );
            setTopics(updatedTopics);
            onDataLoaded?.({data: updatedTopics, error: null, loaded: true});
        } catch {
            // Silently fail metadata fetch
        }
    }, [topics, onDataLoaded]);

    return (
        <ResourceListScreen
            error={error}
            items={topics}
            loading={loading}
            onBack={onBack}
            onItemHovered={(topic) => {
                scheduleFetch(() => fetchTopicMetadata(topic.arn || topic.id));
            }}
            renderMetadata={(topic) => {
                const hasMetadata = topic.displayName !== undefined;

                return (
                    <Box flexDirection='column'>
                        <Text>
                            <Text dimColor>{'Topic Name: '}</Text>
                            {topic.name}
                        </Text>
                        {hasMetadata ? (
                            <>
                                {topic.arn && (
                                    <Text>
                                        <Text dimColor>{'ARN: '}</Text>
                                        {topic.arn}
                                    </Text>
                                )}
                                {topic.displayName && (
                                    <Text>
                                        <Text dimColor>{'Display Name: '}</Text>
                                        {topic.displayName}
                                    </Text>
                                )}
                                {topic.owner && (
                                    <Text>
                                        <Text dimColor>{'Owner: '}</Text>
                                        {topic.owner}
                                    </Text>
                                )}
                                {topic.subscriptionsConfirmed !== undefined && (
                                    <Text>
                                        <Text dimColor>{'Confirmed Subscriptions: '}</Text>
                                        {topic.subscriptionsConfirmed}
                                    </Text>
                                )}
                                {topic.subscriptionsPending !== undefined && (
                                    <Text>
                                        <Text dimColor>{'Pending Subscriptions: '}</Text>
                                        {topic.subscriptionsPending}
                                    </Text>
                                )}
                                {topic.subscriptionsDeleted !== undefined && (
                                    <Text>
                                        <Text dimColor>{'Deleted Subscriptions: '}</Text>
                                        {topic.subscriptionsDeleted}
                                    </Text>
                                )}
                                {topic.tags && topic.tags.length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>{'Tags:'}</Text>
                                        {topic.tags.map((tag) => (
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
            title='SNS Topics'
        />
    );
};
