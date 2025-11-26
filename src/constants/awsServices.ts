export const AWS_SERVICES = [
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
] as const;

export type AwsServiceName = typeof AWS_SERVICES[number]['name'];
