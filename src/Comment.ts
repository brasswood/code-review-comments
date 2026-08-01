export interface Comment {
    id: string;
    content: string;
    fileName: string;
    repositoryRoot: string;
    lineNumber: number;
    hash: string;
    parentHash: string;
    createdAt: string;
    completed: boolean;
}
