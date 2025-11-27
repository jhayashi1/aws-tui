import {
    DescribeInstancesCommand,
    DescribeTagsCommand,
    EC2Client
} from '@aws-sdk/client-ec2';
import {Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {theme} from '../theme.js';
import {type ServiceScreenProps} from '../types/common.js';
import {type EC2Instance} from '../types/resources.js';
import {getAwsRegion} from '../utils/aws.js';
import {ResourceListScreen} from './ResourceListScreen.js';

type EC2ScreenProps = ServiceScreenProps<EC2Instance>;

export const EC2Screen: FC<EC2ScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [instances, setInstances] = useState<EC2Instance[]>(cachedData?.data || []);

    const fetchInstances = useCallback(async (): Promise<EC2Instance[]> => {
        const ec2Client = new EC2Client({
            region: getAwsRegion(),
        });

        const command = new DescribeInstancesCommand({});
        const response = await ec2Client.send(command);
        const instances: EC2Instance[] = [];

        for (const reservation of response.Reservations || []) {
            for (const instance of reservation.Instances || []) {
                const nameTag = instance.Tags?.find((tag) => tag.Key === 'Name');
                instances.push({
                    id          : instance.InstanceId || '',
                    instanceType: instance.InstanceType,
                    name        : nameTag?.Value || instance.InstanceId || 'Unnamed',
                    privateIp   : instance.PrivateIpAddress,
                    publicIp    : instance.PublicIpAddress,
                    state       : instance.State?.Name,
                });
            }
        }

        return instances;
    }, []);

    const {error, loading} = useCachedResource({
        cachedData,
        fetchData   : fetchInstances,
        onDataLoaded: (data) => {
            setInstances(data.data);
            onDataLoaded?.(data);
        },
    });

    const fetchInstanceMetadata = useCallback(async (instanceId: string): Promise<void> => {
        // Check if metadata already exists
        const instance = instances.find(i => i.id === instanceId);
        if (instance?.availabilityZone !== undefined) return;

        try {
            const ec2Client = new EC2Client({
                region: getAwsRegion(),
            });

            const [instanceResponse, tagsResponse] = await Promise.allSettled([
                ec2Client.send(new DescribeInstancesCommand({InstanceIds: [instanceId]})),
                ec2Client.send(new DescribeTagsCommand({
                    Filters: [
                        {
                            Name  : 'resource-id',
                            Values: [instanceId],
                        },
                    ],
                })),
            ]);

            let availabilityZone: string | undefined;
            let launchTime: Date | undefined;
            let platform: string | undefined;
            let vpcId: string | undefined;

            if (instanceResponse.status === 'fulfilled') {
                const instanceData = instanceResponse.value.Reservations?.[0]?.Instances?.[0];
                if (instanceData) {
                    availabilityZone = instanceData.Placement?.AvailabilityZone;
                    launchTime = instanceData.LaunchTime;
                    platform = instanceData.Platform || 'Linux/Unix';
                    vpcId = instanceData.VpcId;
                }
            }

            const tags = tagsResponse.status === 'fulfilled'
                ? tagsResponse.value.Tags || []
                : [];

            // Update the instance in the list with metadata
            const updatedInstances = instances.map(i =>
                i.id === instanceId
                    ? {...i, availabilityZone, launchTime, platform, tags, vpcId}
                    : i
            );
            setInstances(updatedInstances);
            onDataLoaded?.({data: updatedInstances, error: null, loaded: true});
        } catch {
            // Silently fail metadata fetch
        }
    }, [instances, onDataLoaded]);

    return (
        <ResourceListScreen
            error={error}
            getItemDetails={(instance) => {
                const stateColor = instance.state === 'running'
                    ? theme.colors.success
                    : instance.state === 'stopped'
                        ? 'red'
                        : 'yellow';

                return {
                    color : stateColor,
                    suffix: instance.state ? ` (${instance.state})` : undefined,
                };
            }}
            items={instances}
            loading={loading}
            onBack={onBack}
            onItemHovered={(instance) => {
                fetchInstanceMetadata(instance.id);
            }}
            renderMetadata={(instance) => {
                const hasMetadata = instance.availabilityZone !== undefined;

                return (
                    <Box flexDirection='column'>
                        <Text>
                            <Text dimColor>Instance ID: </Text>
                            {instance.id}
                        </Text>
                        <Text>
                            <Text dimColor>Name: </Text>
                            {instance.name}
                        </Text>
                        <Text>
                            <Text dimColor>State: </Text>
                            {instance.state}
                        </Text>
                        <Text>
                            <Text dimColor>Type: </Text>
                            {instance.instanceType || 'Unknown'}
                        </Text>
                        {instance.publicIp && (
                            <Text>
                                <Text dimColor>Public IP: </Text>
                                {instance.publicIp}
                            </Text>
                        )}
                        {instance.privateIp && (
                            <Text>
                                <Text dimColor>Private IP: </Text>
                                {instance.privateIp}
                            </Text>
                        )}
                        {hasMetadata ? (
                            <>
                                {instance.availabilityZone && (
                                    <Text>
                                        <Text dimColor>Availability Zone: </Text>
                                        {instance.availabilityZone}
                                    </Text>
                                )}
                                {instance.vpcId && (
                                    <Text>
                                        <Text dimColor>VPC: </Text>
                                        {instance.vpcId}
                                    </Text>
                                )}
                                {instance.platform && (
                                    <Text>
                                        <Text dimColor>Platform: </Text>
                                        {instance.platform}
                                    </Text>
                                )}
                                {instance.launchTime && (
                                    <Text>
                                        <Text dimColor>Launch Time: </Text>
                                        {instance.launchTime.toLocaleString()}
                                    </Text>
                                )}
                                {instance.tags && instance.tags.length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>Tags:</Text>
                                        {instance.tags.map((tag) => (
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
            title='EC2 Instances'
        />
    );
};
