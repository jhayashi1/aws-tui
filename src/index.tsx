import {render} from 'ink';
import React, {type FC, useState} from 'react';

import {ServiceSelector} from './components/ServiceSelector.js';
import {ROUTES, type ScreenName} from './constants/routes.js';
import {CacheProvider, useCache} from './context/CacheContext.js';

const AppContent: FC = () => {
    const [currentScreen, setCurrentScreen] = useState<ScreenName>('selector');
    const {getCache, setCache} = useCache();

    const handleServiceSelect = (service: string): void => {
        setCurrentScreen(service as ScreenName);
    };

    if (currentScreen === 'selector') {
        return <ServiceSelector onSelect={handleServiceSelect} />;
    }

    // Dynamic routing with cache handling
    const route = ROUTES[currentScreen];
    if (route) {
        const ScreenComponent = route.component;
        const props: any = {
            onBack: () => setCurrentScreen('selector'),
        };

        // Add cache props if this route requires caching
        if (route.requiresCache) {
            props.cachedData = getCache(currentScreen);
            props.onDataLoaded = setCache.bind(null, currentScreen);
        }

        return <ScreenComponent {...props} />;
    }

    return null;
};

export const App: FC = () => {
    return (
        <CacheProvider>
            <AppContent />
        </CacheProvider>
    );
};

render(<App />);
