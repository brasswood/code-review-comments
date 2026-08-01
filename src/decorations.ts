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

function documentContainsComment(document: vscode.TextDocument, comment: Comment): boolean {
    if (document.uri.scheme === 'file') {
        return true;
    }

    if (document.uri.scheme !== 'git') {
        return false;
    }

    try {
        const query = JSON.parse(document.uri.query) as { ref?: unknown };
        return query.ref === ':' || query.ref === comment.hash;
    } catch {
        return false;
    }
}

function commentFileNames(comment: Comment): string[] {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return [];
    }

    const repositoryRoot = path.resolve(
        workspaceFolder.uri.fsPath,
        comment.repositoryRoot ?? ''
    );
    const fileName = path.resolve(repositoryRoot, comment.fileName);

    if (comment.repositoryRoot === undefined) {
        return [fileName];
    }

    // Older comments recorded a workspace-relative filename as well as a
    // repository root. Keep displaying those comments without duplicating the
    // root (for example, stylo/stylo/selectors/parser.rs).
    const workspaceFileName = path.resolve(workspaceFolder.uri.fsPath, comment.fileName);
    const relativeToRepository = path.relative(repositoryRoot, workspaceFileName);
    if (!relativeToRepository.startsWith('..') && !path.isAbsolute(relativeToRepository)) {
        return [fileName, workspaceFileName];
    }

    return [fileName];
}

function legacyCommentMatchesFile(comment: Comment, fileName: string): boolean {
    if (comment.repositoryRoot !== undefined) {
        return false;
    }

    const relativeFileName = path.normalize(comment.fileName);
    const normalizedFileName = path.normalize(fileName);
    return normalizedFileName.endsWith(path.sep + relativeFileName);
}

function commentsForDocument(
    document: vscode.TextDocument,
    commentManager: CommentManager
): Comment[] {
    const fileName = documentFileName(document);
    if (!fileName) {
        return [];
    }

    return commentManager.getComments().filter(comment =>
        !comment.completed &&
        documentContainsComment(document, comment) &&
        (
            commentFileNames(comment).includes(path.resolve(fileName)) ||
            legacyCommentMatchesFile(comment, fileName)
        )
    );
}

/**
 * Adds persisted review comments as native VS Code comment threads.
 *
 * The thread URI is the modified document's URI, so VS Code renders the
 * annotation in its built-in Source Control diff editor as well as ordinary
 * file editors. Git-backed commit diffs are identified by their revision,
 * which keeps the original side of a diff unannotated.
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
    const commentStateByDocument = new Map<string, string>();

    context.subscriptions.push(controller);

    const updateDecorations = (editor: vscode.TextEditor) => {
        const documentKey = editor.document.uri.toString();
        for (const [key, threads] of threadsByDocument) {
            if (key !== documentKey) {
                threads.forEach(thread => thread.dispose());
                threadsByDocument.delete(key);
                commentStateByDocument.delete(key);
            }
        }

        const comments = commentsForDocument(editor.document, commentManager);
        const commentState = JSON.stringify(comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            lineNumber: comment.lineNumber
        })));

        if (commentStateByDocument.get(documentKey) === commentState) {
            return;
        }

        // Creating comment threads changes the visible editor set. Record the
        // new state first so that event cannot start another rebuild.
        commentStateByDocument.set(documentKey, commentState);
        const existingThreads = threadsByDocument.get(documentKey) ?? [];
        existingThreads.forEach(thread => thread.dispose());

        const threads = comments.map(comment => {
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
