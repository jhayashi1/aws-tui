import {
    DescribeInstancesCommand,
    DescribeTagsCommand,
    EC2Client,
    type Tag
} from '@aws-sdk/client-ec2';
import {Spinner} from '@inkjs/ui';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {theme} from '../theme.js';
import {ResourceListScreen} from './ResourceListScreen.js';

interface EC2Instance {
    id: string;
    instanceType?: string;
    name: string;
    privateIp?: string;
    publicIp?: string;
    state?: string;
}

interface EC2ScreenProps {
    cachedData?: {data: EC2Instance[]; error: null | string; loaded: boolean};
    onBack?: () => void;
    onDataLoaded?: (data: {data: EC2Instance[]; error: null | string; loaded: boolean}) => void;
}

export const EC2Screen: FC<EC2ScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [instanceMetadata, setInstanceMetadata] = useState<Record<string, {availabilityZone?: string; launchTime?: Date; platform?: string; tags?: Tag[]; vpcId?: string}>>({});

    const fetchInstances = useCallback(async (): Promise<EC2Instance[]> => {
        const ec2Client = new EC2Client({
            region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
        });

        const command = new DescribeInstancesCommand({});
        const response = await ec2Client.send(command);
        const instances: EC2Instance[] = [];

        for (const reservation of response.Reservations || []) {
            for (const instance of reservation.Instances || []) {
                const nameTag = instance.Tags?.find((tag: Tag) => tag.Key === 'Name');
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

    const {data: instances, error, loading} = useCachedResource({
        cachedData,
        fetchData: fetchInstances,
        onDataLoaded,
    });

    const fetchInstanceMetadata = useCallback(async (instanceId: string): Promise<void> => {
        if (instanceMetadata[instanceId]) return;

        try {
            const ec2Client = new EC2Client({
                region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
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
                const instance = instanceResponse.value.Reservations?.[0]?.Instances?.[0];
                if (instance) {
                    availabilityZone = instance.Placement?.AvailabilityZone;
                    launchTime = instance.LaunchTime;
                    platform = instance.Platform || 'Linux/Unix';
                    vpcId = instance.VpcId;
                }
            }

            const tags = tagsResponse.status === 'fulfilled'
                ? tagsResponse.value.Tags || []
                : [];

            setInstanceMetadata(prev => ({
                ...prev,
                [instanceId]: {availabilityZone, launchTime, platform, tags, vpcId},
            }));
        } catch {
            // Silently fail metadata fetch
        }
    }, [instanceMetadata]);

    return (
        <ResourceListScreen
            error={error}
            items={instances}
            loading={loading}
            onBack={onBack}
            renderItem={(instance, isSelected) => {
                if (isSelected) {
                    fetchInstanceMetadata(instance.id);
                }

                const stateColor = instance.state === 'running'
                    ? theme.colors.success
                    : instance.state === 'stopped'
                        ? 'red'
                        : 'yellow';

                return (
                    <Text
                        bold={isSelected}
                        color={isSelected ? theme.colors.highlight : theme.colors.text}
                    >
                        {isSelected ? '❯ ' : '  '}
                        {instance.name}
                        {' '}
                        <Text color={stateColor}>
                            ({instance.state})
                        </Text>
                    </Text>
                );
            }}
            renderMetadata={(instance) => {
                const metadata = instanceMetadata[instance.id];

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
                        {metadata ? (
                            <>
                                {metadata.availabilityZone && (
                                    <Text>
                                        <Text dimColor>Availability Zone: </Text>
                                        {metadata.availabilityZone}
                                    </Text>
                                )}
                                {metadata.vpcId && (
                                    <Text>
                                        <Text dimColor>VPC: </Text>
                                        {metadata.vpcId}
                                    </Text>
                                )}
                                {metadata.platform && (
                                    <Text>
                                        <Text dimColor>Platform: </Text>
                                        {metadata.platform}
                                    </Text>
                                )}
                                {metadata.launchTime && (
                                    <Text>
                                        <Text dimColor>Launch Time: </Text>
                                        {metadata.launchTime.toLocaleString()}
                                    </Text>
                                )}
                                {metadata.tags && metadata.tags.length > 0 && (
                                    <Box
                                        flexDirection='column'
                                        marginTop={1}
                                    >
                                        <Text dimColor>Tags:</Text>
                                        {metadata.tags.map((tag) => (
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
