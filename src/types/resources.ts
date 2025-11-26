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
