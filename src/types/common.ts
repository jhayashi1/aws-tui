/**
 * Cache data structure for AWS resources
 */
export interface CachedData<T> {
    data: T[];
    error: null | string;
    loaded: boolean;
}

/**
 * Common props interface for AWS service screens
 */
export interface ServiceScreenProps<T> {
    cachedData?: CachedData<T>;
    onBack?: () => void;
    onDataLoaded?: (data: CachedData<T>) => void;
}
