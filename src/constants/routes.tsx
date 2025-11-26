import {Box, Text, useInput} from 'ink';
import React, {type FC} from 'react';

import {S3Screen} from '../components/S3Screen.js';
import {theme} from '../theme.js';

export interface RouteConfig {
    component: FC<any>;
    name: ScreenName;
}

export type ScreenName = 'API Gateway' | 'CloudFront' | 'CloudWatch' | 'DynamoDB' | 'EC2' | 'ECS' | 'EKS' | 'IAM' | 'Lambda' | 'RDS' | 'Route 53' | 'S3' | 'selector' | 'SNS' | 'SQS' | 'VPC';

// Placeholder component for services without screens yet
// eslint-disable-next-line react-refresh/only-export-components
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

export const ROUTES: Record<ScreenName, FC<any>> = {
    'API Gateway': ComingSoon,
    CloudFront   : ComingSoon,
    CloudWatch   : ComingSoon,
    DynamoDB     : ComingSoon,
    EC2          : ComingSoon,
    ECS          : ComingSoon,
    EKS          : ComingSoon,
    IAM          : ComingSoon,
    Lambda       : ComingSoon,
    RDS          : ComingSoon,
    'Route 53'   : ComingSoon,
    S3           : S3Screen,
    selector     : ComingSoon, // Will be handled separately in App
    SNS          : ComingSoon,
    SQS          : ComingSoon,
    VPC          : ComingSoon,
};
