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

function commentFileName(comment: Comment): string | undefined {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        return undefined;
    }

    return path.resolve(
        workspaceFolder.uri.fsPath,
        comment.repositoryRoot,
        comment.fileName
    );
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
        commentFileName(comment) === path.resolve(fileName)
    );
}

/**
 * Adds persisted review comments as native VS Code comment threads.
 *
 * Git-backed commit diffs are identified by their revision, which keeps the
 * original side of a diff and working tree documents unannotated.
 */
export function setupDecorations(
    context: vscode.ExtensionContext,
    commentManager: CommentManager
) {
    const controller = vscode.comments.createCommentController(
        'code-review-comments',
        'Code Review Comments'
    );
    const commentMarker = vscode.window.createTextEditorDecorationType({
        gutterIconPath: context.asAbsolutePath('resources/comment-marker.svg'),
        gutterIconSize: 'cover',
        overviewRulerColor: new vscode.ThemeColor('editorInfo.foreground'),
        overviewRulerLane: vscode.OverviewRulerLane.Right
    });
    const threadsByDocument = new Map<string, vscode.CommentThread[]>();
    const commentByThread = new Map<vscode.CommentThread, Comment>();
    const commentStateByDocument = new Map<string, string>();

    context.subscriptions.push(controller);
    context.subscriptions.push(commentMarker);

    const updateDecorations = (editor: vscode.TextEditor) => {
        const documentKey = editor.document.uri.toString();
        for (const [key, threads] of threadsByDocument) {
            if (key !== documentKey) {
                threads.forEach(thread => {
                    commentByThread.delete(thread);
                    thread.dispose();
                });
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
        existingThreads.forEach(thread => {
            commentByThread.delete(thread);
            thread.dispose();
        });

        const markers: vscode.DecorationOptions[] = [];
        const threads = comments.map(comment => {
            const line = Math.min(Math.max(comment.lineNumber - 1, 0), editor.document.lineCount - 1);
            const range = new vscode.Range(line, 0, line, 0);
            const body = new vscode.MarkdownString(comment.content);
            markers.push({
                range,
                hoverMessage: new vscode.MarkdownString('Review comment')
            });
            const thread = controller.createCommentThread(editor.document.uri, range, [
                {
                    author: commentAuthor,
                    body,
                    mode: vscode.CommentMode.Preview
                }
            ]);
            thread.collapsibleState = vscode.CommentThreadCollapsibleState.Collapsed;
            thread.canReply = false;
            thread.contextValue = 'code-review-comments';
            commentByThread.set(thread, comment);
            return thread;
        });
        editor.setDecorations(commentMarker, markers);

        if (threads.length === 0) {
            threadsByDocument.delete(documentKey);
        } else {
            threadsByDocument.set(documentKey, threads);
        }
    };

    return {
        updateDecorations,
        commentForThread: (thread: vscode.CommentThread): Comment | undefined =>
            commentByThread.get(thread)
    };
}
