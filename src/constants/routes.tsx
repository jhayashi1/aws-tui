import {Box, Text, useInput} from 'ink';
import React, {type FC} from 'react';

import {DynamoDBScreen} from '../components/DynamoDBScreen.js';
import {EC2Screen} from '../components/EC2Screen.js';
import {LambdaScreen} from '../components/LambdaScreen.js';
import {RDSScreen} from '../components/RDSScreen.js';
import {S3Screen} from '../components/S3Screen.js';
import {theme} from '../theme.js';

export interface RouteConfig {
    component: FC<any>;
    name: ScreenName;
    requiresCache?: boolean;
}

export type ScreenName = 'API Gateway' | 'CloudFront' | 'CloudWatch' | 'DynamoDB' | 'EC2' | 'ECS' | 'EKS' | 'IAM' | 'Lambda' | 'RDS' | 'Route 53' | 'S3' | 'selector' | 'SNS' | 'SQS' | 'VPC';

// Placeholder component for services without screens yet
const ComingSoon: FC<{onBack?: () => void}> = ({onBack}) => {
    useInput((input, key) => {
        if (key.escape || (key.ctrl && input === 'c')) {
            if (onBack) {
                onBack();
            } else {
                process.exit(0);
            }
        } else if (input === 'b' || input === 'B') {
            if (onBack) {
                onBack();
            }
        }
    });

    return (
        <Box
            flexDirection='column'
            paddingX={2}
            paddingY={1}
        >
            <Box
                justifyContent='center'
                marginBottom={1}
            >
                <Text
                    bold
                    color={theme.colors.primary}
                >
                    Coming Soon
                </Text>
            </Box>
            <Text>This service screen is not yet implemented.</Text>
            <Box marginTop={1}>
                <Text dimColor>Press B to go back | Esc to exit</Text>
            </Box>
        </Box>
    );
};

export const ROUTES: Record<ScreenName, RouteConfig> = {
    'API Gateway': {component: ComingSoon, name: 'API Gateway'},
    CloudFront   : {component: ComingSoon, name: 'CloudFront'},
    CloudWatch   : {component: ComingSoon, name: 'CloudWatch'},
    DynamoDB     : {component: DynamoDBScreen, name: 'DynamoDB', requiresCache: true},
    EC2          : {component: EC2Screen, name: 'EC2', requiresCache: true},
    ECS          : {component: ComingSoon, name: 'ECS'},
    EKS          : {component: ComingSoon, name: 'EKS'},
    IAM          : {component: ComingSoon, name: 'IAM'},
    Lambda       : {component: LambdaScreen, name: 'Lambda', requiresCache: true},
    RDS          : {component: RDSScreen, name: 'RDS', requiresCache: true},
    'Route 53'   : {component: ComingSoon, name: 'Route 53'},
    S3           : {component: S3Screen, name: 'S3', requiresCache: true},
    selector     : {component: ComingSoon, name: 'selector'},
    SNS          : {component: ComingSoon, name: 'SNS'},
    SQS          : {component: ComingSoon, name: 'SQS'},
    VPC          : {component: ComingSoon, name: 'VPC'},
};
