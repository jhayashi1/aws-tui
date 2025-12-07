import {useCallback, useRef} from 'react';

interface UseMetadataFetchOptions {
    delay?: number;
}

interface UseMetadataFetchReturn {
    cancelFetch: () => void;
    scheduleFetch: (fetchFn: () => Promise<void> | void) => void;
}

export const useMetadataFetch = (options: UseMetadataFetchOptions = {}): UseMetadataFetchReturn => {
    const {delay = 1000} = options;
    const timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);

    const scheduleFetch = useCallback((fetchFn: () => Promise<void> | void) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            fetchFn();
        }, delay);
    }, [delay]);

    const cancelFetch = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    return {cancelFetch, scheduleFetch};
};
