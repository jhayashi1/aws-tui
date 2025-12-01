/**
 * CloudFront Distribution resource interface
 */
export interface CloudFrontDistribution {
    aliases?: string[];
    comment?: string;
    domainName?: string;
    enabled?: boolean;
    id: string;
    lastModifiedTime?: Date;
    name: string;
    priceClass?: string;
    status?: string;
    tags?: Array<{Key?: string; Value?: string}>;
}

/**
 * DynamoDB Table resource interface
 */
export interface DynamoDBTable {
    billingMode?: string;
    creationDate?: Date;
    id: string;
    itemCount?: number;
    name: string;
    readCapacity?: number;
    status?: string;
    tableSize?: number;
    tags?: Array<{Key?: string; Value?: string}>;
    writeCapacity?: number;
}

/**
 * EC2 Instance resource interface
 */
export interface EC2Instance {
    availabilityZone?: string;
    id: string;
    instanceType?: string;
    launchTime?: Date;
    name: string;
    platform?: string;
    privateIp?: string;
    publicIp?: string;
    state?: string;
    tags?: Array<{Key?: string; Value?: string}>;
    vpcId?: string;
}

/**
 * Lambda Function resource interface
 */
export interface LambdaFunction {
    architectures?: string[];
    codeSize?: number;
    description?: string;
    environment?: Record<string, string>;
    handler?: string;
    id: string;
    lastModified?: string;
    memorySize?: number;
    name: string;
    runtime?: string;
    tags?: Record<string, string>;
    timeout?: number;
}

/**
 * RDS Database Instance resource interface
 */
export interface RDSInstance {
    allocatedStorage?: number;
    availabilityZone?: string;
    dbInstanceClass?: string;
    endpoint?: string;
    engine?: string;
    engineVersion?: string;
    id: string;
    multiAZ?: boolean;
    name: string;
    status?: string;
    tags?: Array<{Key?: string; Value?: string}>;
}

/**
 * S3 Bucket resource interface
 */
export interface S3Bucket {
    creationDate?: Date;
    id: string;
    location?: string;
    name: string;
    objectCount?: number;
    tags?: Array<{Key?: string; Value?: string}>;
    totalSize?: number;
    versioning?: string;
}

/**
 * SNS Topic resource interface
 */
export interface SNSTopic {
    arn?: string;
    displayName?: string;
    id: string;
    name: string;
    owner?: string;
    policy?: string;
    subscriptionsConfirmed?: number;
    subscriptionsDeleted?: number;
    subscriptionsPending?: number;
    tags?: Array<{Key?: string; Value?: string}>;
}

/**
 * SQS Queue resource interface
 */
export interface SQSQueue {
    approximateMessages?: number;
    approximateMessagesDelayed?: number;
    approximateMessagesNotVisible?: number;
    createdTimestamp?: Date;
    delaySeconds?: number;
    id: string;
    lastModifiedTimestamp?: Date;
    maxMessageSize?: number;
    messageRetentionPeriod?: number;
    name: string;
    queueArn?: string;
    tags?: Array<{Key?: string; Value?: string}>;
    visibilityTimeout?: number;
}

/**
 * VPC resource interface
 */
export interface VPC {
    cidrBlock?: string;
    dhcpOptionsId?: string;
    id: string;
    instanceTenancy?: string;
    isDefault?: boolean;
    name: string;
    state?: string;
    tags?: Array<{Key?: string; Value?: string}>;
}
