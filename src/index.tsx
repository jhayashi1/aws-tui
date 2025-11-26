import {render} from 'ink';
import React, {type FC, useState} from 'react';

import {S3Screen} from './components/S3Screen.js';
import {ServiceSelector} from './components/ServiceSelector.js';
import {ROUTES, type ScreenName} from './constants/routes.js';

interface Bucket {
    CreationDate?: Date;
    Name?: string;
}

export const App: FC = () => {
    const [currentScreen, setCurrentScreen] = useState<ScreenName>('selector');
    const [s3Cache, setS3Cache] = useState<{
        buckets: Bucket[];
        error: null | string;
        loaded: boolean;
    }>({buckets: [], error: null, loaded: false});

    const handleServiceSelect = (service: string): void => {
        setCurrentScreen(service as ScreenName);
    };

    if (currentScreen === 'selector') {
        return <ServiceSelector onSelect={handleServiceSelect} />;
    }

    // Special handling for S3 screen with caching
    if (currentScreen === 'S3') {
        return (
            <S3Screen
                cachedData={s3Cache}
                onBack={() => setCurrentScreen('selector')}
                onDataLoaded={setS3Cache}
            />
        );
    }

    // Render the appropriate screen based on route map
    const ScreenComponent = ROUTES[currentScreen];
    if (ScreenComponent) {
        return <ScreenComponent onBack={() => setCurrentScreen('selector')} />;
    }

    return null;
};

render(<App />);
