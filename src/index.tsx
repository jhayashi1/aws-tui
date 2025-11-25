import {createCliRenderer} from '@opentui/core';
import {createRoot} from '@opentui/react';
import {useState} from 'react';

const AWS_SERVICES = [
    {description: 'Simple Storage Service - Object storage', name: 'S3'},
    {description: 'Elastic Compute Cloud - Virtual servers', name: 'EC2'},
    {description: 'Serverless compute service', name: 'Lambda'},
    {description: 'NoSQL database service', name: 'DynamoDB'},
    {description: 'Relational Database Service', name: 'RDS'},
    {description: 'Content delivery network', name: 'CloudFront'},
    {description: 'Virtual Private Cloud - Network isolation', name: 'VPC'},
    {description: 'Identity and Access Management', name: 'IAM'},
    {description: 'Monitoring and observability', name: 'CloudWatch'},
    {description: 'Simple Notification Service', name: 'SNS'},
    {description: 'Simple Queue Service', name: 'SQS'},
    {description: 'Build and manage APIs', name: 'API Gateway'},
    {description: 'Elastic Container Service', name: 'ECS'},
    {description: 'Elastic Kubernetes Service', name: 'EKS'},
    {description: 'DNS and domain management', name: 'Route 53'},
];

export const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedService, setSelectedService] = useState<null | string>(null);

    const filteredServices = AWS_SERVICES.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Reset selection when filter changes
    const currentMax = filteredServices.length - 1;
    if (selectedIndex > currentMax && currentMax >= 0) {
        setSelectedIndex(currentMax);
    }

    const handleSelect = () => {
        const service = filteredServices[selectedIndex];
        if (service) {
            setSelectedService(service.name);
            console.log(`Selected: ${service.name}`);
        }
    };

    return (
        <box
            flexDirection='column'
            padding={2}
        >
            <box
                justifyContent='center'
                marginBottom={1}
            >
                <ascii-font
                    color='#FF9900'
                    font='huge'
                    text='AWS'
                />
            </box>

            <box
                flexDirection='column'
                marginBottom={1}
            >
                <box marginBottom={1}>
                    <text fg='cyan'>Search: </text>
                    <input
                        onChange={setSearchTerm}
                        onInput={setSearchTerm}
                        placeholder='Type to search...'
                        value={searchTerm}
                    />
                </box>
                <text attributes={2}>
                    Type to search, use ↑↓ arrows to navigate, Enter to select
                </text>
            </box>

            {selectedService && (
                <box
                    backgroundColor='#232F3E'
                    marginBottom={1}
                    padding={1}
                >
                    <text fg='#FF9900'>Selected: </text>
                    <text fg='white'>{selectedService}</text>
                </box>
            )}

            <select
                focused
                height={15}
                onChange={(index) => setSelectedIndex(index)}
                onSelect={handleSelect}
                options={filteredServices}
                selectedBackgroundColor='#FF9900'
                selectedIndex={selectedIndex}
                selectedTextColor='#000000'
                showDescription
            />
        </box>
    );
};

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
