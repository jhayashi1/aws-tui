import {Spinner} from '@inkjs/ui';
import {Box, Text, useInput} from 'ink';
import TextInput from 'ink-text-input';
import React, {useState} from 'react';

import {theme} from '../theme.js';

interface ResourceListItem {
    description?: string;
    id: string;
    metadata?: string;
    name: string;
    runtime?: string;
    state?: string;
    status?: string;
}

interface ResourceListScreenProps<T> {
    error: null | string;
    getItemDetails?: (item: T) => {color?: string; suffix?: string} | undefined;
    items: T[];
    loading: boolean;
    onBack?: () => void;
    onItemHovered?: (item: T) => void;
    onSelect?: (item: T) => void;
    renderMetadata?: (item: T) => React.ReactNode;
    title: string;
}

export function ResourceListScreen<T extends ResourceListItem>({
    error,
    getItemDetails,
    items,
    loading,
    onBack,
    onItemHovered,
    onSelect,
    renderMetadata,
    title,
}: ResourceListScreenProps<T>): React.ReactElement {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const validSelectedIndex = Math.min(selectedIndex, Math.max(0, filteredItems.length - 1));
    const currentSelectedItem = filteredItems[validSelectedIndex];

    // Call onItemHovered when selection changes
    React.useEffect(() => {
        if (currentSelectedItem && onItemHovered) {
            onItemHovered(currentSelectedItem);
        }
    }, [currentSelectedItem, onItemHovered]);

    useInput((input, key) => {
        if (key.upArrow) {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        } else if (key.downArrow) {
            setSelectedIndex(prev => Math.min(filteredItems.length - 1, prev + 1));
        } else if (key.return && onSelect) {
            if (filteredItems[validSelectedIndex]) {
                onSelect(filteredItems[validSelectedIndex]);
            }
        } else if (key.escape || (key.ctrl && input === 'c')) {
            if (onBack) {
                onBack();
            } else {
                process.exit(0);
            }
        }
    });

    if (loading) {
        return (
            <Box
                flexDirection='column'
                paddingX={2}
                paddingY={1}
            >
                <Box>
                    <Spinner label={`Loading ${title}...`} />
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                flexDirection='column'
                paddingX={2}
                paddingY={1}
            >
                <Text color='red'>Error: {error}</Text>
                <Box marginTop={1}>
                    <Text dimColor>Press B to go back | Esc to exit</Text>
                </Box>
            </Box>
        );
    }

    const selectedItem = filteredItems[validSelectedIndex];

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
                    {title} ({items.length})
                </Text>
            </Box>

            <Box marginBottom={1}>
                <Text>Search: </Text>
                <TextInput
                    onChange={setSearchQuery}
                    onSubmit={() => {
                        if (onSelect && filteredItems[validSelectedIndex]) {
                            onSelect(filteredItems[validSelectedIndex]);
                        }
                    }}
                    value={searchQuery}
                />
            </Box>

            <Box
                borderColor={theme.colors.primary}
                borderStyle='round'
                flexDirection='column'
                paddingX={1}
                paddingY={0}
            >
                {filteredItems.length > 0 ? (
                    filteredItems.map((item, index) => {
                        const isSelected = index === validSelectedIndex;
                        const details = getItemDetails?.(item);

                        return (
                            <Box
                                key={item.id}
                                marginY={0}
                            >
                                <Text
                                    backgroundColor={isSelected ? theme.colors.highlight : undefined}
                                    bold={isSelected}
                                    color={isSelected ? 'black' : theme.colors.text}
                                >
                                    {item.name}
                                    {details?.suffix && (
                                        <Text color={details.color}>
                                            {details.suffix}
                                        </Text>
                                    )}
                                </Text>
                            </Box>
                        );
                    })
                ) : (
                    <Text dimColor>
                        {searchQuery ? 'No matching results' : `No ${title.toLowerCase()} found`}
                    </Text>
                )}
            </Box>

            {renderMetadata && selectedItem && (
                <Box
                    borderColor={theme.colors.dim}
                    borderStyle='round'
                    flexDirection='column'
                    marginTop={1}
                    paddingX={1}
                    paddingY={0}
                >
                    {renderMetadata(selectedItem)}
                </Box>
            )}

            <Box marginTop={1}>
                <Text dimColor>
                    ↑↓ Navigate
                    {onSelect ? ' | Enter: Select' : ''}
                    {' | Esc: Exit'}
                </Text>
            </Box>
        </Box>
    );
}
