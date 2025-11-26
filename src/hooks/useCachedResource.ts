import {useEffect, useState} from 'react';

interface UseCachedResourceOptions<T> {
    cachedData?: {
        data: T[];
        error: null | string;
        loaded: boolean;
    };
    fetchData: () => Promise<T[]>;
    onDataLoaded?: (result: {data: T[]; error: null | string; loaded: boolean}) => void;
}

interface UseCachedResourceResult<T> {
    data: T[];
    error: null | string;
    loading: boolean;
}

export function useCachedResource<T>({
    cachedData,
    fetchData,
    onDataLoaded,
}: UseCachedResourceOptions<T>): UseCachedResourceResult<T> {
    const [data, setData] = useState<T[]>(cachedData?.data || []);
    const [loading, setLoading] = useState(!cachedData?.loaded);
    const [error, setError] = useState<null | string>(cachedData?.error || null);

    useEffect(() => {
        // Skip fetch if we have cached data
        if (cachedData?.loaded) {
            return;
        }

        const fetch = async (): Promise<void> => {
            try {
                const result = await fetchData();
                setData(result);
                if (onDataLoaded) {
                    onDataLoaded({data: result, error: null, loaded: true});
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMsg);
                if (onDataLoaded) {
                    onDataLoaded({data: [], error: errorMsg, loaded: true});
                }
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [cachedData?.loaded, fetchData, onDataLoaded]);

    return {data, error, loading};
}
