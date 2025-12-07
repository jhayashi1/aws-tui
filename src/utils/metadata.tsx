import type {ReactNode} from 'react';

import {Box, Text} from 'ink';

import {theme} from '../theme.js';

export interface MetadataConfig<T> {
    fields: MetadataField<T>[];
}

export interface MetadataField<T> {
    condition?: (item: T) => boolean;
    format?: (value: unknown) => ReactNode | string;
    getValue: (item: T) => unknown;
    label: string;
}

interface KeyValueListProps {
    items: Record<string, unknown>;
    label: string;
    maxDisplay?: number;
}

interface RenderMetadataProps<T> {
    config: MetadataConfig<T>;
    item: T;
}

export function KeyValueList({items, label, maxDisplay}: KeyValueListProps): ReactNode {
    const entries = Object.entries(items);
    const displayEntries = maxDisplay ? entries.slice(0, maxDisplay) : entries;
    const remaining = maxDisplay && entries.length > maxDisplay ? entries.length - maxDisplay : 0;

    return (
        <Box
            flexDirection='column'
            marginTop={1}
        >
            <Text dimColor>{label}</Text>
            {displayEntries.map(([key, value]) => (
                <Text key={key}>
                    {'  '}
                    <Text color={theme.colors.highlight}>{key}</Text>
                    {': '}
                    {String(value).length > 50 ? `${String(value).slice(0, 50)}...` : String(value)}
                </Text>
            ))}
            {remaining > 0 && (
                <Text dimColor>
                    {'  ... and '}{remaining}{' more'}
                </Text>
            )}
        </Box>
    );
}

export function renderMetadata<T>({config, item}: RenderMetadataProps<T>): ReactNode {
    return (
        <Box flexDirection='column'>
            {config.fields.map((field, index) => {
                // Check condition if provided
                if (field.condition && !field.condition(item)) {
                    return null;
                }

                const value = field.getValue(item);

                // Skip if value is undefined or null
                if (value === undefined || value === null) {
                    return null;
                }

                const formattedValue = field.format ? field.format(value) : String(value);

                return (
                    <Text key={index}>
                        <Text dimColor>{field.label}</Text>
                        {formattedValue}
                    </Text>
                );
            })}
        </Box>
    );
}
