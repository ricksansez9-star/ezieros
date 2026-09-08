// sys32/commandsterm/cd.js
export function run(args, terminalState) {
    const targetDir = args[0];

    // Default to root if no path specified
    if (!targetDir || targetDir === '~' || targetDir === '/') {
        terminalState.currentPath = '/';
        return;
    }

    // Resolve relative vs absolute paths
    let resolvedPath = targetDir.startsWith('/')
        ? targetDir
        : `${terminalState.currentPath}/${targetDir}`.replace(/\/+/g, '/');

    // Handle parent directory ".."
    if (targetDir === '..') {
        const parts = terminalState.currentPath.split('/').filter(Boolean);
        parts.pop();
        resolvedPath = '/' + parts.join('/');
    }

    // Verify folder exists in VFS
    const dirNode = terminalState.vfs.get(resolvedPath);
    if (dirNode && dirNode.type === 'dir') {
        terminalState.currentPath = resolvedPath;
    } else {
        terminalState.print(`cd: no such file or directory: ${targetDir}`, 'error');
    }
}