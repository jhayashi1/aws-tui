import {
    CloudFrontClient,
    type DistributionSummary,
    ListDistributionsCommand,
    ListTagsForResourceCommand
} from '@aws-sdk/client-cloudfront';
import {Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {theme} from '../theme.js';
import {type ServiceScreenProps} from '../types/common.js';
import {type CloudFrontDistribution} from '../types/resources.js';
import {getAwsRegion} from '../utils/aws.js';
import {ResourceListScreen} from './ResourceListScreen.js';

type CloudFrontScreenProps = ServiceScreenProps<CloudFrontDistribution>;

export const CloudFrontScreen: FC<CloudFrontScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [distributions, setDistributions] = useState<CloudFrontDistribution[]>(cachedData?.data || []);

    const fetchDistributions = useCallback(async (): Promise<CloudFrontDistribution[]> => {
        const cloudFrontClient = new CloudFrontClient({
            region: getAwsRegion(),
        });

        const command = new ListDistributionsCommand({});
        const response = await cloudFrontClient.send(command);
        const items = response.DistributionList?.Items || [];

        return items.map((dist: DistributionSummary) => ({
            aliases   : dist.Aliases?.Items,
            comment   : dist.Comment,
            domainName: dist.DomainName,
            enabled   : dist.Enabled,
            id        : dist.Id || 'unknown',
            name      : dist.Aliases?.Items?.[0] || dist.DomainName || dist.Id || 'unknown',
            priceClass: dist.PriceClass,
            status    : dist.Status,
        }));
    }, []);

    const {error, loading} = useCachedResource({
        cachedData,
        fetchData   : fetchDistributions,
        onDataLoaded: (data) => {
            setDistributions(data.data);
            onDataLoaded?.(data);
        },
    });

    const fetchDistributionMetadata = useCallback(async (distributionId: string): Promise<void> => {
        const distribution = distributions.find(d => d.id === distributionId);
        if (distribution?.lastModifiedTime !== undefined) return;

        try {
            const cloudFrontClient = new CloudFrontClient({
                region: getAwsRegion(),
            });

            // Fetch tags
            let tags: Array<{Key?: string; Value?: string}> = [];
            try {
                const tagsResponse = await cloudFrontClient.send(
                    new ListTagsForResourceCommand({
                        Resource: `arn:aws:cloudfront::${distribution?.id}`,
                    })
                );
                tags = tagsResponse.Tags?.Items || [];
            } catch {
                // Tags may not be accessible
            }

            const updatedDistributions = distributions.map(d =>
                d.id === distributionId
                    ? {
                        ...d,
                        tags,
                    }
                    : d
            );
            setDistributions(updatedDistributions);
            onDataLoaded?.({data: updatedDistributions, error: null, loaded: true});
        } catch {
            // Silently fail metadata fetch
        }
    }, [distributions, onDataLoaded]);

    return (
        <ResourceListScreen
            error={error}
            getItemDetails={(distribution) => {
                const statusColor = distribution.status === 'Deployed'
                    ? theme.colors.success
                    : distribution.status === 'InProgress'
                        ? 'yellow'
                        : 'red';

                return {
                    color : statusColor,
                    suffix: distribution.status ? ` (${distribution.status})` : undefined,
                };
            }}
            items={distributions}
            loading={loading}
            onBack={onBack}
            onItemHovered={(distribution) => {
                fetchDistributionMetadata(distribution.id);
            }}
            renderMetadata={(distribution) => (
                <Box flexDirection='column'>
                    <Text>
                        <Text dimColor>ID: </Text>
                        {distribution.id}
                    </Text>
                    {distribution.domainName && (
                        <Text>
                            <Text dimColor>Domain: </Text>
                            {distribution.domainName}
                        </Text>
                    )}
                    {distribution.status && (
                        <Text>
                            <Text dimColor>Status: </Text>
                            {distribution.status}
                        </Text>
                    )}
                    {distribution.enabled !== undefined && (
                        <Text>
                            <Text dimColor>Enabled: </Text>
                            {distribution.enabled ? 'Yes' : 'No'}
                        </Text>
                    )}
                    {distribution.priceClass && (
                        <Text>
                            <Text dimColor>Price Class: </Text>
                            {distribution.priceClass}
                        </Text>
                    )}
                    {distribution.aliases && distribution.aliases.length > 0 && (
                        <Box
                            flexDirection='column'
                            marginTop={1}
                        >
                            <Text dimColor>Aliases:</Text>
                            {distribution.aliases.map((alias) => (
                                <Text key={alias}>
                                    {'  '}
                                    {alias}
                                </Text>
                            ))}
                        </Box>
                    )}
                    {distribution.comment && (
                        <Text>
                            <Text dimColor>Comment: </Text>
                            {distribution.comment}
                        </Text>
                    )}
                    {distribution.tags && distribution.tags.length > 0 && (
                        <Box
                            flexDirection='column'
                            marginTop={1}
                        >
                            <Text dimColor>Tags:</Text>
                            {distribution.tags.map((tag) => (
                                <Text key={tag.Key}>
                                    {'  '}
                                    <Text color={theme.colors.highlight}>{tag.Key}</Text>
                                    {': '}
                                    {tag.Value}
                                </Text>
                            ))}
                        </Box>
                    )}
                </Box>
            )}
            title='CloudFront Distributions'
        />
    );
};
