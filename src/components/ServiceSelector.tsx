import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import {type FC, useState} from 'react';

import {AWS_SERVICES} from '../constants/awsServices.js';
import {theme} from '../theme.js';

interface ServiceSelectorProps {
    onSelect: (service: string) => void;
}

export const ServiceSelector: FC<ServiceSelectorProps> = ({onSelect}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredServices = AWS_SERVICES.filter(
        service =>
            service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Clamp selected index to valid range
    const validSelectedIndex = Math.min(
        selectedIndex,
        Math.max(0, filteredServices.length - 1)
    );

    useInput((input, key) => {
        if (key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setSelectedIndex(prev => Math.min(filteredServices.length - 1, prev + 1));
        } else if (key.return) {
            if (filteredServices[validSelectedIndex]) {
                onSelect(filteredServices[validSelectedIndex].name);
            }
        } else if (key.escape || (key.ctrl && input === 'c')) {
            process.exit(0);
        }
    });

    return (
        <Box
            flexDirection='column'
            paddingX={2}
            paddingY={1}
        >
            <Box
                marginBottom={1}
            >
                <Text
                    bold
                    color={theme.colors.primary}
                >
                    {'AWS Service Selector'}
                </Text>
            </Box>

            <Box
                flexDirection='column'
                paddingX={2}
                paddingY={1}
            >
                <Box marginBottom={1}>
                    <Text>{'Search: '}</Text>
                    <TextInput
                        onChange={setSearchQuery}
                        onSubmit={() => {
                            if (filteredServices[validSelectedIndex]) {
                                onSelect(filteredServices[validSelectedIndex].name);
                            }
                        }}
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
                                    color={index === validSelectedIndex ? theme.colors.selected : theme.colors.text}
                                >
                                    {service.name}
                                </Text>
                            </Box>
                        ))
                    ) : (
                        <Text dimColor>{'No services found'}</Text>
                    )}
                </Box>

                <Box marginTop={1}>
                    <Text dimColor>{'↑↓ Navigate | Enter: Select | Esc: Exit'}</Text>
                </Box>
            </Box>
        </Box>
    );
};
