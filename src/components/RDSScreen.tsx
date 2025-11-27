import {
    type DBInstance,
    DescribeDBInstancesCommand,
    RDSClient,
    type Tag
} from '@aws-sdk/client-rds';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {theme} from '../theme.js';
import {type ServiceScreenProps} from '../types/common.js';
import {type RDSInstance} from '../types/resources.js';
import {formatBytes, getAwsRegion} from '../utils/aws.js';
import {ResourceListScreen} from './ResourceListScreen.js';

type RDSScreenProps = ServiceScreenProps<RDSInstance>;

export const RDSScreen: FC<RDSScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [instances, setInstances] = useState<RDSInstance[]>(cachedData?.data || []);

    const fetchInstances = useCallback(async (): Promise<RDSInstance[]> => {
        const rdsClient = new RDSClient({
            region: getAwsRegion(),
        });

        const command = new DescribeDBInstancesCommand({});
        const response = await rdsClient.send(command);
        const dbInstances = response.DBInstances || [];

        return dbInstances.map((instance: DBInstance) => ({
            allocatedStorage: instance.AllocatedStorage,
            availabilityZone: instance.AvailabilityZone,
            dbInstanceClass : instance.DBInstanceClass,
            endpoint        : instance.Endpoint?.Address,
            engine          : instance.Engine,
            engineVersion   : instance.EngineVersion,
            id              : instance.DBInstanceIdentifier || 'unknown',
            multiAZ         : instance.MultiAZ,
            name            : instance.DBInstanceIdentifier || 'unknown',
            status          : instance.DBInstanceStatus,
            tags            : instance.TagList as Tag[] | undefined,
        }));
    }, []);

    const {error, loading} = useCachedResource({
        cachedData,
        fetchData   : fetchInstances,
        onDataLoaded: (data) => {
            setInstances(data.data);
            onDataLoaded?.(data);
        },
    });

    return (
        <ResourceListScreen
            error={error}
            getItemDetails={(instance) => {
                const statusColor = instance.status === 'available'
                    ? theme.colors.success
                    : instance.status === 'deleting'
                        ? 'red'
                        : 'yellow';

                return {
                    color : statusColor,
                    suffix: instance.status ? ` (${instance.status})` : undefined,
                };
            }}
            items={instances}
            loading={loading}
            onBack={onBack}
            renderMetadata={(instance) => (
                <Box flexDirection='column'>
                    <Text>
                        <Text dimColor>DB Instance: </Text>
                        {instance.name}
                    </Text>
                    {instance.status && (
                        <Text>
                            <Text dimColor>Status: </Text>
                            {instance.status}
                        </Text>
                    )}
                    {instance.engine && (
                        <Text>
                            <Text dimColor>Engine: </Text>
                            {instance.engine} {instance.engineVersion}
                        </Text>
                    )}
                    {instance.dbInstanceClass && (
                        <Text>
                            <Text dimColor>Instance Class: </Text>
                            {instance.dbInstanceClass}
                        </Text>
                    )}
                    {instance.allocatedStorage !== undefined && (
                        <Text>
                            <Text dimColor>Storage: </Text>
                            {formatBytes(instance.allocatedStorage * 1024 * 1024 * 1024)}
                        </Text>
                    )}
                    {instance.availabilityZone && (
                        <Text>
                            <Text dimColor>Availability Zone: </Text>
                            {instance.availabilityZone}
                        </Text>
                    )}
                    {instance.multiAZ !== undefined && (
                        <Text>
                            <Text dimColor>Multi-AZ: </Text>
                            {instance.multiAZ ? 'Yes' : 'No'}
                        </Text>
                    )}
                    {instance.endpoint && (
                        <Text>
                            <Text dimColor>Endpoint: </Text>
                            {instance.endpoint}
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
                </Box>
            )}
            title='RDS Instances'
        />
    );
};
