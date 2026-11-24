import * as path from 'path';
import * as vscode from 'vscode';

export interface GitGraphDocumentData {
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
        if (!data.filePath || !data.commit || !data.repo || typeof data.filePath !== 'string' ||
            typeof data.commit !== 'string' || typeof data.repo !== 'string') {
            return undefined;
        }
        return data as GitGraphDocumentData;
    } catch {
        return undefined;
    }
}

export interface GitGraphDiffInfo {
    repositoryRoot: string;
    relativeFileName: string;
    commitHash: string;
    parentHash: string;
}

export function getGitGraphDiffInfo(modifiedUri: vscode.Uri, originalUri: vscode.Uri): GitGraphDiffInfo | undefined {
    const modified = getGitGraphDocument(modifiedUri);
    if (!modified) {
        return undefined;
    }

    const original = getGitGraphDocument(originalUri);
    if (!original || path.resolve(original.repo) !== path.resolve(modified.repo)) {
        return undefined;
    }

    return {
        repositoryRoot: path.resolve(modified.repo),
        relativeFileName: modified.filePath,
        commitHash: modified.commit,
        parentHash: original.commit
    };
}
