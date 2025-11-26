import {render} from 'ink';
import React, {type FC, useState} from 'react';

import {EC2Screen} from './components/EC2Screen.js';
import {LambdaScreen} from './components/LambdaScreen.js';
import {S3Screen} from './components/S3Screen.js';
import {ServiceSelector} from './components/ServiceSelector.js';
import {ROUTES, type ScreenName} from './constants/routes.js';

interface S3Bucket {
    creationDate?: Date;
    id: string;
    name: string;
}

interface EC2Instance {
    id: string;
    instanceType?: string;
    name: string;
    privateIp?: string;
    publicIp?: string;
    state?: string;
}

interface LambdaFunction {
    description?: string;
    id: string;
    name: string;
    runtime?: string;
}

export const App: FC = () => {
    const [currentScreen, setCurrentScreen] = useState<ScreenName>('selector');
    const [s3Cache, setS3Cache] = useState<{
        data: S3Bucket[];
        error: null | string;
        loaded: boolean;
    }>({data: [], error: null, loaded: false});
    const [ec2Cache, setEc2Cache] = useState<{
        data: EC2Instance[];
        error: null | string;
        loaded: boolean;
    }>({data: [], error: null, loaded: false});
    const [lambdaCache, setLambdaCache] = useState<{
        data: LambdaFunction[];
        error: null | string;
        loaded: boolean;
    }>({data: [], error: null, loaded: false});

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

    // Special handling for EC2 screen with caching
    if (currentScreen === 'EC2') {
        return (
            <EC2Screen
                cachedData={ec2Cache}
                onBack={() => setCurrentScreen('selector')}
                onDataLoaded={setEc2Cache}
            />
        );
    }

    // Special handling for Lambda screen with caching
    if (currentScreen === 'Lambda') {
        return (
            <LambdaScreen
                cachedData={lambdaCache}
                onBack={() => setCurrentScreen('selector')}
                onDataLoaded={setLambdaCache}
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
