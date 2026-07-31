import * as path from 'path';
import * as vscode from 'vscode';
import { Comment } from './Comment';
import { CommentManager } from './CommentManager';

const commentAuthor: vscode.CommentAuthorInformation = {
    name: 'Code Review Comments'
};

function documentFileName(document: vscode.TextDocument): string | undefined {
    if (document.uri.scheme === 'file') {
        return document.uri.fsPath;
    }

    if (document.uri.scheme !== 'git') {
        return undefined;
    }

    try {
        const query = JSON.parse(document.uri.query) as { path?: unknown };
        return typeof query.path === 'string' ? query.path : undefined;
    } catch {
        return undefined;
    }
}

function isModifiedDocument(document: vscode.TextDocument): boolean {
    if (document.uri.scheme === 'file') {
        return true;
    }

    if (document.uri.scheme !== 'git') {
        return false;
    }

    try {
        const query = JSON.parse(document.uri.query) as { ref?: unknown };
        return query.ref === ':';
    } catch {
        return false;
    }
}

function commentFileName(comment: Comment): string | undefined {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return undefined;
    }

    return path.resolve(
        workspaceFolder.uri.fsPath,
        comment.repositoryRoot ?? '',
        comment.fileName
    );
}

function commentsForDocument(
    document: vscode.TextDocument,
    commentManager: CommentManager
): Comment[] {
    if (!isModifiedDocument(document)) {
        return [];
    }

    const fileName = documentFileName(document);
    if (!fileName) {
        return [];
    }

    return commentManager.getComments().filter(comment =>
        !comment.completed &&
        commentFileName(comment) === path.resolve(fileName)
    );
}

/**
 * Adds persisted review comments as native VS Code comment threads.
 *
 * The thread URI is the modified document's URI, so VS Code renders the
 * annotation in its built-in Source Control diff editor as well as ordinary
 * file editors. The original side of a diff is deliberately skipped because
 * stored line numbers refer to the modified side.
 */
export function setupDecorations(
    context: vscode.ExtensionContext,
    commentManager: CommentManager
) {
    const controller = vscode.comments.createCommentController(
        'code-review-comments',
        'Code Review Comments'
    );
    const threadsByDocument = new Map<string, vscode.CommentThread[]>();

    context.subscriptions.push(controller);

    const updateDecorations = (editor: vscode.TextEditor) => {
        const documentKey = editor.document.uri.toString();
        const existingThreads = threadsByDocument.get(documentKey) ?? [];
        existingThreads.forEach(thread => thread.dispose());

        const threads = commentsForDocument(editor.document, commentManager).map(comment => {
            const line = Math.min(Math.max(comment.lineNumber - 1, 0), editor.document.lineCount - 1);
            const range = new vscode.Range(line, 0, line, 0);
            const body = new vscode.MarkdownString(comment.content);
            return controller.createCommentThread(editor.document.uri, range, [
                {
                    author: commentAuthor,
                    body,
                    mode: vscode.CommentMode.Preview
                }
            ]);
        });

        if (threads.length === 0) {
            threadsByDocument.delete(documentKey);
        } else {
            threadsByDocument.set(documentKey, threads);
        }
    };

    return updateDecorations;
}
