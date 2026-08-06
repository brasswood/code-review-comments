import * as vscode from 'vscode';
import { Comment, CommitGroup } from './Comment';

type CommentTreeItem = Comment | CommitGroup;

export class CommentProvider implements vscode.TreeDataProvider<CommentTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<CommentTreeItem | undefined | null | void>();
    private readonly commitSubjects = new Map<string, Promise<string | undefined>>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(
        private comments: Comment[],
        private readonly getCommitSubject: (repositoryRoot: string, hash: string) => Promise<string | undefined>
    ) { }

    refresh(comments: Comment[]): void {
        this.comments = comments;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: CommentTreeItem): vscode.TreeItem {
        if (this.isCommitGroup(element)) {
            const shortHash = element.hash.substring(0, 7);
            const label = `${shortHash} ${element.message ?? '(subject unavailable)'}`;
            const treeItem = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.Collapsed);
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
            return this.commitGroups();
        }
        if (this.isCommitGroup(element)) {
            return Promise.resolve(element.comments);
        }
        return Promise.resolve([]);
    }

    private async commitGroups(): Promise<CommitGroup[]> {
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
        return Promise.all([...groups.values()].map(async group => ({
            ...group,
            message: await this.commitSubject(group)
        })));
    }

    private commitSubject(group: CommitGroup): Promise<string | undefined> {
        const key = `${group.repositoryRoot}\0${group.hash}`;
        const subject = this.commitSubjects.get(key);
        if (subject) {
            return subject;
        }
        const resolvedSubject = this.getCommitSubject(group.repositoryRoot, group.hash);
        this.commitSubjects.set(key, resolvedSubject);
        return resolvedSubject;
    }

    private isCommitGroup(element: CommentTreeItem): element is CommitGroup {
        return 'comments' in element;
    }
}
