import {createCliRenderer} from '@opentui/core';
import {createRoot} from '@opentui/react';

export const App = () => {
    return (
        <box>
            <box
                justifyContent='center'
                marginLeft={2}
            >
                <ascii-font
                    color={'#FF9900'}
                    font='huge'
                    text='AWS'
                />
                <text>What will you build?</text>
            </box>
        </box>
    );
};

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
