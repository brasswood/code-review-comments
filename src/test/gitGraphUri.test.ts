import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { getGitInfoForUri } from '../gitUtils';

suite('Git Graph diff metadata', () => {
    const uri = (repo: string, commit: string) => vscode.Uri.from({
        scheme: 'git-graph',
        path: '/file.ts',
        query: Buffer.from(JSON.stringify({ filePath: 'src/file.ts', commit, repo })).toString('base64')
    });

    test('preserves the selected base and modified commits', async () => {
        const info = await getGitInfoForUri(uri('C:\\repo', 'right-commit'), uri('C:\\repo', 'arbitrary-base'));

        assert.deepStrictEqual(info, {
            repositoryRoot: path.resolve('C:\\repo'),
            relativeFileName: 'src/file.ts',
            commitHash: 'right-commit',
            parentHash: 'arbitrary-base'
        });
    });

    test('rejects a base URI from another repository', async () => {
        assert.strictEqual(await getGitInfoForUri(uri('C:\\repo', 'right'), uri('C:\\other', 'base')), undefined);
    });
});
