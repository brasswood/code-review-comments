import * as vscode from 'vscode';

interface GitGraphDocumentData {
    filePath: string;
    commit: string;
    repo: string;
}

export function getGitGraphDocument(uri: vscode.Uri): GitGraphDocumentData | undefined {
    if (uri.scheme !== 'git-graph') {
        return undefined;
    }

    try {
        const data = JSON.parse(Buffer.from(decodeURIComponent(uri.query), 'base64').toString('utf8')) as Partial<GitGraphDocumentData>;
        if (typeof data.filePath !== 'string' || typeof data.commit !== 'string' || typeof data.repo !== 'string') {
            return undefined;
        }
        return data as GitGraphDocumentData;
    } catch {
        return undefined;
    }
}
