# Diff Comments for VS Code

A powerful VS Code extension that allows you to add comments to diff views, just like in GitHub Pull Requests. Keep track of your code review thoughts, bug reports, and improvement suggestions directly in your development environment.

![Code Review Comments](https://cdn.jsdelivr.net/gh/guzhongren/picx-images-hosting@master/plugins/code-review-comments/code-review-comments.6bhdgqda0w.gif)

## Features

### 🎯 Context-Aware Comments
- **Diff View Comments**: Add comments when viewing diffs between commits
- **File-Specific Comments**: Comments are tied to specific commits and file changes
- **Smart Commit Detection**: Automatically detects the relevant commit and parent commit for each comment
- **Nested Repository Support**: Comments retain the Git repository that owns
  their file, including repositories nested inside the workspace

### 📝 Comment Management
- **Add Comments**: Right-click in diff views or use the command palette to add comments
- **Edit Comments**: Modify existing comments inline
- **Delete Comments**: Remove comments you no longer need
- **Jump to Comments**: Click on comments to navigate to the exact diff location

### 🔍 Advanced Diff Navigation
- **Commit-to-Commit Diffs**: View changes between specific commits (parent → current)
- **Commit-to-Workspace Diffs**: Compare commits with your current workspace
- **File History Awareness**: Comments are linked to the actual commits that modified each file

### 💬 Native Diff Annotations
- **Source Control Integration**: Saved comments appear as native, clickable
  VS Code comment threads in the modified side of Source Control diffs
- **Gutter Markers**: A high-contrast marker identifies lines with review
  comments and provides a short hover label

### 💾 Persistent Storage
- Comments are stored in `.vscode/diff-comments.yaml` in your workspace
- YAML format for easy reading and version control
- Each comment records its repository root as well as its file path, so nested
  repository comments open in the correct diff

## Installation

1. Open VS Code
2. Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Diff Comments"
4. Click Install

## How to Use

### Quick Start Guide

1. **Open a Git repository** in VS Code
2. **Open the Diff Comments view** by clicking on the Diff Comments icon in the Activity Bar
3. **Add your first comment** using one of the methods below
4. **View and manage comments** in the dedicated tree view

### Step-by-Step Usage

#### Method 1: Adding Comments in Diff Views (Recommended)

1. **Open a diff view** using any of these methods:
  - **Git History**: Open Source Control → Click on a commit → Select a modified file
  - **Compare Files**: Use `Ctrl+Shift+P` → "Git: Compare File with..."
  - **Git Diff**: Open terminal → `git diff HEAD~1 HEAD filename.ts`

2. **Add a comment**:
  - Right-click on any line in the diff view
  - Select "Add Diff Comment" from the context menu
  - Type your comment in the input box
  - Press Enter to save

3. **Your comment is now saved** and visible in the Diff Comments tree view
   and as a native comment bubble in supported VS Code diff editors

#### Method 2: Adding Comments to Regular Files

1. **Open any file** in your Git repository
2. **Position your cursor** on the line you want to comment on
3. **Add a comment**:
  - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
  - Type "Add Diff Comment" and press Enter
  - Or use the right-click context menu
4. **Enter your comment** and press Enter

> 💡 **Note**: When adding comments to regular files, the extension automatically detects the last commit that modified the file and creates appropriate diff context.

#### Method 3: Using Keyboard Shortcuts

1. **Position your cursor** on the desired line
2. **Press the shortcut** (if configured in your keybindings)
3. **Type your comment** and press Enter

### Managing Your Comments

#### Viewing Comments

- **Open the Diff Comments view** in the Activity Bar (left sidebar)
- **Comments are grouped by file** and show:
  - 📝 Comment text
  - 📁 File path
  - 🔗 Commit information (e.g., `a1b2c3d → b2c3d4e`)
  - ✅ Completion status

#### Editing Comments

1. **Locate the comment** in the Diff Comments tree view
2. **Click the edit icon** (✏️) next to the comment
3. **Modify the text** in the input dialog
4. **Press Enter** to save changes

#### Deleting Comments

1. **Find the comment** in the tree view
2. **Click the delete icon** (🗑️)
3. **Confirm deletion** when prompted

#### Jumping to Comment Location

1. **Click on any comment** in the tree view
2. **VS Code will automatically**:
  - Open the relevant diff view
  - Navigate to the exact line
  - Highlight the commented code

#### Marking Comments as Complete

1. **Right-click on a comment** in the tree view
2. **Select "Toggle Completed"**
3. **Completed comments** will show a ✅ icon and move to the bottom of the list

### Advanced Usage Scenarios

#### Code Review Workflow

1. **Review a pull request** or commit
2. **Add comments** for issues, suggestions, or questions
3. **Mark comments as complete** after addressing them
4. **Jump back to comments** during implementation

#### Bug Tracking

1. **Add comments** when you find bugs during development
2. **Include details** about reproduction steps or expected behavior
3. **Track progress** by marking comments as complete
4. **Reference specific commits** where bugs were introduced

#### Documentation and Notes

1. **Add comments** to document complex code sections
2. **Track TODOs** and improvement ideas
3. **Link comments to specific commits** for context
4. **Share insights** with team members

### Tips and Best Practices

✅ **Best Practices**:
- Write clear, descriptive comments
- Use comments for code review feedback
- Mark comments as complete when resolved
- Include context about why changes are needed

⚠️ **Things to Remember**:
- Comments are stored in `.vscode/diff-comments.yaml`
- Comments are tied to specific commits and file changes
- Make sure your project is a Git repository
- Comments persist across VS Code sessions

### Troubleshooting

**Comment not showing up?**
- Ensure you're in a Git repository
- Check that the file has been committed to Git
- Try refreshing the Diff Comments view
- In a Source Control diff, select the modified file side; comments are not
  displayed on the original side

**Can't add comments?**
- Verify Git is installed and working
- Make sure the file is part of a Git repository
- Check that you have write permissions to the workspace

**Diff view not opening?**
- Ensure the referenced commits still exist
- Try refreshing the Git repository
- Check that Git extension is enabled

## Usage

### Adding Comments

1. **In Diff View**:
  - Open a diff view (e.g., from Git history, Source Control, or using `git diff`)
  - Right-click at the line where you want to add a comment
  - Select "Add Diff Comment" or use `Ctrl+Shift+P` → "Add Diff Comment"

2. **In Regular Files**:
  - Open any file in a Git repository
  - Use the command palette (`Ctrl+Shift+P`) → "Add Diff Comment"
  - The extension will automatically find the last commit that modified the file

### Viewing Comments

- Open the **Diff Comments** view in the Activity Bar
- Comments are displayed with file paths and commit information
- Format: `filename (parentHash → commitHash)` for diff comments
- Format: `filename (commitHash)` for single-commit comments

### Managing Comments

- **Edit**: Click the edit icon (✏️) next to any comment in the tree view
- **Delete**: Click the delete icon (🗑️) next to any comment
- **Jump**: Click on a comment to open the diff view at that exact location

## Commands

| Command                       | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| `diff-comments.addComment`    | Add a new comment to the current file/diff       |
| `diff-comments.refresh`       | Refresh the comments tree view                   |
| `diff-comments.editComment`   | Edit an existing comment                         |
| `diff-comments.deleteComment` | Delete a comment                                 |
| `diff-comments.jumpToComment` | Jump to the diff location of a comment           |
| `diff-comments.showDiffInfo`  | Show detailed information about the current diff |

## Comment Storage Format

Comments are stored in `.vscode/diff-comments.yaml` with the following structure:

```yaml
- id: "unique-comment-id"
  content: "Your comment text"
  fileName: "relative/path/to/file.ts"
  repositoryRoot: "path/to/nested/repository"
  lineNumber: 42
  hash: "abc123def456"        # The commit being commented on
  parentHash: "def456abc123"  # The parent commit for diff context
  createdAt: "2026-08-05T10:30:00-05:00"
  completed: false
```

### Fields Explanation

- **id**: Unique identifier for the comment
- **content**: The comment content
- **fileName**: Path to the file relative to its Git repository root
- **repositoryRoot**: Path from the workspace root to that Git repository
- **lineNumber**: One-based line number where the comment was added
- **hash**: The commit hash that the comment refers to
- **parentHash**: The parent commit hash used to create the diff
- **createdAt**: The comment creation time, including its UTC offset
- **completed**: Whether the review item has been completed

## Key Benefits

### 🚀 Enhanced Code Review
- Add review comments directly in your IDE
- Track comments across different commits
- Perfect for solo development or team code reviews

### 🎯 Precise Context
- Each comment is tied to specific file changes
- Comments show the exact diff where they were added
- No more losing track of what you were thinking about

### 🔄 Workflow Integration
- Works seamlessly with Git workflows
- Comments persist across VS Code sessions
- Easy to share via version control (optional)

## Examples

### Adding a Comment in Diff View
```
1. Open Git history for a file
2. Select a commit to view its diff
3. Right-click on a line in the diff
4. Select "Add Diff Comment"
5. Enter your comment: "This function should handle edge cases"
```

### Viewing Comments
```
Diff Comments View:
├── 📝 This function should handle edge cases
│   └── src/utils/helper.ts (a1b2c3d → b2c3d4e)
├── 📝 Consider adding unit tests
│   └── src/components/Button.tsx (c3d4e5f → d4e5f6a)
└── 📝 Performance optimization needed
    └── src/services/api.ts (e5f6a7b → f6a7b8c)
```

## Configuration

Currently, the extension works out of the box with no configuration required. Comments are automatically stored in your workspace's `.vscode` directory.

## Requirements

- VS Code 1.85.0 or higher
- Git repository (for commit detection)
- Git extension enabled in VS Code

## Known Limitations

- Comments are workspace-specific
- Requires Git repository for full functionality
- Binary files are not supported for diff comments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Changelog

### 0.0.1
- Initial release
- Basic comment functionality
- Diff view support
- YAML storage format
- Context-aware commit detection

## How to Start debug in local env

1. Install deps via `npm install`
2. Press `F5` to launch a new VS Code window with the extension loaded

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues or have feature requests, please file an issue on the GitHub repository.

---

**Happy coding with contextual comments!** 🎉
