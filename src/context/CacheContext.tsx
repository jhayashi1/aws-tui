import React, {createContext, type FC, type ReactNode, useContext, useState} from 'react';

import {type CachedData} from '../types/common.js';

interface CacheContextValue {
    getCache: <T>(key: string) => CachedData<T> | undefined;
    setCache: <T>(key: string, data: CachedData<T>) => void;
}

const CacheContext = createContext<CacheContextValue | undefined>(undefined);

export const CacheProvider: FC<{children: ReactNode}> = ({children}) => {
    const [caches, setCaches] = useState<Record<string, CachedData<any>>>({});

    const getCache = <T, >(key: string): CachedData<T> | undefined => {
        return caches[key];
    };

    const setCache = <T, >(key: string, data: CachedData<T>): void => {
        setCaches(prev => ({...prev, [key]: data}));
    };

    return (
        <CacheContext.Provider value={{getCache, setCache}}>
            {children}
        </CacheContext.Provider>
    );
};

export const useCache = (): CacheContextValue => {
    const context = useContext(CacheContext);
    if (!context) {
        throw new Error('useCache must be used within a CacheProvider');
    }
    return context;
};
