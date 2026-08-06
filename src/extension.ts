import * as vscode from 'vscode';
import * as path from 'path';
import { CommentManager } from './CommentManager';
import { Comment } from './Comment';
import { CommentProvider } from './CommentProvider';
import { DiffContentProvider } from './DiffContentProvider';
import { v4 as uuidv4 } from 'uuid';
import { formatTimestampWithTimezone } from './utils/time';
import { getGitInfoForUri } from './gitUtils';
import { setupDecorations } from './decorations';

export function activate(context: vscode.ExtensionContext) {

    const commentManager = new CommentManager();
    const commentProvider = new CommentProvider(commentManager.getComments());

    vscode.window.registerTreeDataProvider('code-review-comments-view', commentProvider);

    const { updateDecorations, commentForThread } = setupDecorations(context, commentManager);

    const commentForCommandTarget = (target: unknown): Comment | undefined => {
        if (typeof target !== 'object' || target === null) {
            return undefined;
        }

        const comment = target as Partial<Comment>;
        if (typeof comment.id === 'string' && typeof comment.content === 'string') {
            return comment as Comment;
        }

        const thread = 'thread' in target
            ? (target as { thread: vscode.CommentThread }).thread
            : target as vscode.CommentThread;
        return commentForThread(thread);
    };

    const refreshView = () => {
        commentProvider.refresh(commentManager.getComments());
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            updateDecorations(editor);
        }
    };

    context.subscriptions.push(vscode.commands.registerCommand('code-review-comments.addComment', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const position = editor.selection.active;
        const commentText = await vscode.window.showInputBox({ prompt: 'Enter your comment' });
        if (!commentText) {
            return;
        }

        let commitHash: string;
        let parentHash: string;
        let relativeFileName: string;
        let repositoryRoot: string;

        if (editor.document.uri.scheme === 'git') {
            // Adding comment from a Git diff view (right side)
            const gitInfo = await getGitInfoForUri(editor.document.uri);
            if (!gitInfo) {
                return;
            }
            commitHash = gitInfo.commitHash;
            parentHash = gitInfo.parentHash;
            relativeFileName = gitInfo.relativeFileName;
            repositoryRoot = gitInfo.repositoryRoot;

        } else if (editor.document.uri.scheme === 'file') {
            // Adding comment from a regular file editor
            const blameResult = await commentManager.getBlameCommitForLine(editor.document.uri, position.line + 1);
            if (!blameResult) {
                vscode.window.showErrorMessage('Could not get Git blame information for the current line.');
                return;
            }
            commitHash = blameResult.commitHash;
            parentHash = blameResult.parentHash;
            relativeFileName = vscode.workspace.asRelativePath(editor.document.fileName);
            repositoryRoot = blameResult.repositoryRoot;
        } else {
            // Handle other schemes if necessary, or show an error
            vscode.window.showErrorMessage(`Unsupported document scheme: ${editor.document.uri.scheme}`);
            return;
        }

        const newComment: Comment = {
            id: uuidv4(),
            content: commentText,
            fileName: relativeFileName,
            repositoryRoot: path.relative(vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? '', repositoryRoot),
            lineNumber: position.line + 1,
            hash: commitHash,
            parentHash: parentHash,
            createdAt: formatTimestampWithTimezone(new Date()),
            completed: false
        };
        commentManager.addComment(newComment);
        refreshView();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('code-review-comments.deleteComment', (target: unknown) => {
        const comment = commentForCommandTarget(target);
        if (!comment) {
            return;
        }
        commentManager.deleteComment(comment.id);
        refreshView();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('code-review-comments.refresh', () => {
        refreshView();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('code-review-comments.deleteAllComments', async () => {
        const confirm = await vscode.window.showWarningMessage(
            'Are you sure you want to delete all comments? This action cannot be undone.',
            { modal: true },
            'Delete All'
        );
        if (confirm === 'Delete All') {
            commentManager.deleteAllComments();
            refreshView();
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('code-review-comments.toggleAllCommentsCompleted', () => {
        commentManager.toggleAllCommentsCompleted();
        refreshView();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('code-review-comments.toggleCompleted', (comment: Comment) => {
        comment.completed = !comment.completed;
        commentManager.updateComment(comment);
        refreshView();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('code-review-comments.editComment', async (comment: Comment) => {
        const newCommentText = await vscode.window.showInputBox({ value: comment.content, prompt: 'Edit your comment' });
        if (newCommentText) {
            comment.content = newCommentText;
            commentManager.updateComment(comment);
            refreshView();
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('code-review-comments.showDiff', async (comment: Comment) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder open.');
            return;
        }

        const repositoryRoot = path.join(workspaceFolder.uri.fsPath, comment.repositoryRoot);
        const absoluteFileName = path.join(repositoryRoot, comment.fileName);

        const relativeFilePathForTitle = vscode.workspace.asRelativePath(absoluteFileName);

        const fileUri = vscode.Uri.file(absoluteFileName);
        const gitUriForRevision = (ref: string) => vscode.Uri.from({
            scheme: 'git',
            path: fileUri.path,
            query: JSON.stringify({ path: absoluteFileName, ref })
        });
        const originalUri = gitUriForRevision(comment.parentHash);
        const modifiedUri = gitUriForRevision(comment.hash);

        const shortParent = comment.parentHash && comment.parentHash.length >= 7 ? comment.parentHash.substring(0, 7) : (comment.parentHash || 'n/a');
        const shortHash = comment.hash && comment.hash.length >= 7 ? comment.hash.substring(0, 7) : (comment.hash || 'n/a');
        const title = `Diff: ${relativeFilePathForTitle} (${shortParent}..${shortHash})`;

        // Add selection to jump to the line in the modified (right) file of the diff view
        const options: vscode.TextDocumentShowOptions = {
            preview: true,
            selection: new vscode.Range(comment.lineNumber - 1, 0, comment.lineNumber - 1, 0)
        };

        await vscode.commands.executeCommand('vscode.diff', originalUri, modifiedUri, title, options);
    }));

    // Register the DiffContentProvider
    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(DiffContentProvider.scheme, new DiffContentProvider()));

    // Setup decorations
    // Initial decoration update for all visible editors
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }

    // Update decorations when the active editor changes
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations(editor);
        }
    }));

    // Update decorations when a document is saved (relevant for regular files)
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(document => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === document);
        if (editor) {
            updateDecorations(editor);
        }
    }));

    // Update decorations when visible text editors change (e.g., opening/closing diff views)
    context.subscriptions.push(vscode.window.onDidChangeVisibleTextEditors(editors => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editors.some(visibleEditor => visibleEditor.document === editor.document)) {
            updateDecorations(editor);
        }
    }));
}

export function deactivate() {}
