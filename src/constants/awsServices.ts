export const AWS_SERVICES = [
    {name: 'S3'},
    {name: 'EC2'},
    {name: 'Lambda'},
    {name: 'DynamoDB'},
    {name: 'RDS'},
    {name: 'CloudFront'},
    {name: 'VPC'},
    {name: 'IAM'},
    {name: 'CloudWatch'},
    {name: 'SNS'},
    {name: 'SQS'},
    {name: 'API Gateway'},
    {name: 'ECS'},
    {name: 'EKS'},
    {name: 'Route 53'},
] as const;

export type AwsServiceName = typeof AWS_SERVICES[number]['name'];
