import {Box, render, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import React, {type FC, useState} from 'react';

import {theme} from './theme.js';

const AWS_SERVICES = [
    {description: 'Simple Storage Service - Object storage', name: 'S3'},
    {description: 'Elastic Compute Cloud - Virtual servers', name: 'EC2'},
    {description: 'Serverless compute service', name: 'Lambda'},
    {description: 'NoSQL database service', name: 'DynamoDB'},
    {description: 'Relational Database Service', name: 'RDS'},
    {description: 'Content delivery network', name: 'CloudFront'},
    {description: 'Virtual Private Cloud - Network isolation', name: 'VPC'},
    {description: 'Identity and Access Management', name: 'IAM'},
    {description: 'Monitoring and observability', name: 'CloudWatch'},
    {description: 'Simple Notification Service', name: 'SNS'},
    {description: 'Simple Queue Service', name: 'SQS'},
    {description: 'Build and manage APIs', name: 'API Gateway'},
    {description: 'Elastic Container Service', name: 'ECS'},
    {description: 'Elastic Kubernetes Service', name: 'EKS'},
    {description: 'DNS and domain management', name: 'Route 53'},
];

export const App: FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedService, setSelectedService] = useState<null | string>(null);

    const filteredServices = AWS_SERVICES.filter(
        service =>
            service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Clamp selected index to valid range
    const validSelectedIndex = Math.min(
        selectedIndex,
        Math.max(0, filteredServices.length - 1)
    );

    useInput((input, key) => {
        if (selectedService) return;

        if (key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setSelectedIndex(prev => Math.min(filteredServices.length - 1, prev + 1));
        } else if (key.return) {
            if (filteredServices[validSelectedIndex]) {
                setSelectedService(filteredServices[validSelectedIndex].name);
            }
        } else if (key.escape) {
            process.exit(0);
        }
    });

    if (selectedService) {
        return (
            <Box
                flexDirection='column'
                paddingX={2}
                paddingY={1}
            >
                <Text color={theme.colors.success}>✓ Selected: {selectedService}</Text>
                <Box marginTop={1}>
                    <Text dimColor>Press Esc to exit</Text>
                </Box>
            </Box>
        );
    }

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
                    AWS Service Selector
                </Text>
            </Box>

            <Box marginBottom={1}>
                <Text>Search: </Text>
                <TextInput
                    onChange={setSearchQuery}
                    value={searchQuery}
                />
            </Box>

            <Box flexDirection='column'>
                {filteredServices.length > 0 ? (
                    filteredServices.map((service, index) => (
                        <Box
                            key={service.name}
                            marginY={0}
                        >
                            <Text
                                bold={index === validSelectedIndex}
                                color={index === validSelectedIndex ? theme.colors.highlight : theme.colors.text}
                            >
                                {index === validSelectedIndex ? '❯ ' : '  '}
                                {service.name}
                                <Text dimColor> - {service.description}</Text>
                            </Text>
                        </Box>
                    ))
                ) : (
                    <Text dimColor>No services found</Text>
                )}
            </Box>

            <Box marginTop={1}>
                <Text dimColor>↑↓ Navigate | Enter: Select | Esc: Exit</Text>
            </Box>
        </Box>
    );
};

render(<App />);
