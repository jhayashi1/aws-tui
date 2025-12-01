import {
    DescribeVpcsCommand,
    EC2Client,
    type Tag,
    type Vpc
} from '@aws-sdk/client-ec2';
import {Box, Text} from 'ink';
import React, {type FC, useCallback, useState} from 'react';

import {useCachedResource} from '../hooks/useCachedResource.js';
import {theme} from '../theme.js';
import {type ServiceScreenProps} from '../types/common.js';
import {type VPC} from '../types/resources.js';
import {getAwsRegion} from '../utils/aws.js';
import {ResourceListScreen} from './ResourceListScreen.js';

type VPCScreenProps = ServiceScreenProps<VPC>;

export const VPCScreen: FC<VPCScreenProps> = ({cachedData, onBack, onDataLoaded}) => {
    const [vpcs, setVpcs] = useState<VPC[]>(cachedData?.data || []);

    const fetchVpcs = useCallback(async (): Promise<VPC[]> => {
        const ec2Client = new EC2Client({
            region: getAwsRegion(),
        });

        const command = new DescribeVpcsCommand({});
        const response = await ec2Client.send(command);
        const vpcList = response.Vpcs || [];

        return vpcList.map((vpc: Vpc) => {
            const nameTag = vpc.Tags?.find((tag: Tag) => tag.Key === 'Name');
            return {
                cidrBlock      : vpc.CidrBlock,
                dhcpOptionsId  : vpc.DhcpOptionsId,
                id             : vpc.VpcId || 'unknown',
                instanceTenancy: vpc.InstanceTenancy,
                isDefault      : vpc.IsDefault,
                name           : nameTag?.Value || vpc.VpcId || 'unknown',
                state          : vpc.State,
                tags           : vpc.Tags as Array<{Key?: string; Value?: string}> | undefined,
            };
        });
    }, []);

    const {error, loading} = useCachedResource({
        cachedData,
        fetchData   : fetchVpcs,
        onDataLoaded: (data) => {
            setVpcs(data.data);
            onDataLoaded?.(data);
        },
    });

    return (
        <ResourceListScreen
            error={error}
            getItemDetails={(vpc) => {
                const stateColor = vpc.state === 'available'
                    ? theme.colors.success
                    : 'yellow';

                return {
                    color : stateColor,
                    suffix: vpc.state ? ` (${vpc.state})` : undefined,
                };
            }}
            items={vpcs}
            loading={loading}
            onBack={onBack}
            renderMetadata={(vpc) => (
                <Box flexDirection='column'>
                    <Text>
                        <Text dimColor>VPC ID: </Text>
                        {vpc.id}
                    </Text>
                    {vpc.state && (
                        <Text>
                            <Text dimColor>State: </Text>
                            {vpc.state}
                        </Text>
                    )}
                    {vpc.cidrBlock && (
                        <Text>
                            <Text dimColor>CIDR Block: </Text>
                            {vpc.cidrBlock}
                        </Text>
                    )}
                    {vpc.isDefault !== undefined && (
                        <Text>
                            <Text dimColor>Default VPC: </Text>
                            {vpc.isDefault ? 'Yes' : 'No'}
                        </Text>
                    )}
                    {vpc.instanceTenancy && (
                        <Text>
                            <Text dimColor>Tenancy: </Text>
                            {vpc.instanceTenancy}
                        </Text>
                    )}
                    {vpc.dhcpOptionsId && (
                        <Text>
                            <Text dimColor>DHCP Options: </Text>
                            {vpc.dhcpOptionsId}
                        </Text>
                    )}
                    {vpc.tags && vpc.tags.length > 0 && (
                        <Box
                            flexDirection='column'
                            marginTop={1}
                        >
                            <Text dimColor>Tags:</Text>
                            {vpc.tags.map((tag) => (
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
            title='VPCs'
        />
    );
};
