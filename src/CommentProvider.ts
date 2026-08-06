import * as vscode from 'vscode';
import { Comment, CommitGroup } from './Comment';

type CommentTreeItem = Comment | CommitGroup;

export class CommentProvider implements vscode.TreeDataProvider<CommentTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<CommentTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private comments: Comment[]) { }

    refresh(comments: Comment[]): void {
        this.comments = comments;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: CommentTreeItem): vscode.TreeItem {
        if (this.isCommitGroup(element)) {
            const shortHash = element.hash.substring(0, 7);
            const treeItem = new vscode.TreeItem(shortHash, vscode.TreeItemCollapsibleState.Collapsed);
            treeItem.description = `${element.comments.length} comment${element.comments.length === 1 ? '' : 's'}`;
            treeItem.contextValue = 'commitGroup';
            treeItem.iconPath = new vscode.ThemeIcon('git-commit');
            return treeItem;
        }

        const treeItem = new vscode.TreeItem(element.content, vscode.TreeItemCollapsibleState.None);
        const shortParent = element.parentHash && element.parentHash.length >= 7 ? element.parentHash.substring(0, 7) : (element.parentHash || 'n/a');
        const shortHash = element.hash && element.hash.length >= 7 ? element.hash.substring(0, 7) : (element.hash || 'n/a');
        treeItem.description = `${element.fileName}:${element.lineNumber} (${shortParent}<->${shortHash}) - ${new Date(element.createdAt).toLocaleString()}`;
        treeItem.command = {
            command: 'code-review-comments.showDiff',
            title: 'Show Diff',
            arguments: [element]
        };
        treeItem.contextValue = 'comment';
        treeItem.iconPath = new vscode.ThemeIcon(element.completed ? 'check' : 'comment');
        return treeItem;
    }

    getChildren(element?: CommentTreeItem): Thenable<CommentTreeItem[]> {
        if (!element) {
            return Promise.resolve(this.commitGroups());
        }
        if (this.isCommitGroup(element)) {
            return Promise.resolve(element.comments);
        }
        return Promise.resolve([]);
    }

    private commitGroups(): CommitGroup[] {
        const groups = new Map<string, CommitGroup>();
        for (const comment of this.comments) {
            const key = `${comment.repositoryRoot}\0${comment.hash}`;
            const group = groups.get(key);
            if (group) {
                group.comments.push(comment);
            } else {
                groups.set(key, { hash: comment.hash, repositoryRoot: comment.repositoryRoot, comments: [comment] });
            }
        }
        return [...groups.values()];
    }

    private isCommitGroup(element: CommentTreeItem): element is CommitGroup {
        return 'comments' in element;
    }
}
