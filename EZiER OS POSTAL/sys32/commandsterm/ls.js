
// sys32/commandsterm/ls.js
export function run(args, terminalState) {
    const targetPath = args[0]
        ? (args[0].startsWith('/') ? args[0] : `${terminalState.currentPath}/${args[0]}`.replace(/\/+/g, '/'))
        : terminalState.currentPath;

    const dirNode = terminalState.vfs.get(targetPath);

    if (!dirNode || dirNode.type !== 'dir') {
        terminalState.print(`ls: cannot access '${targetPath}': No such directory`, 'error');
        return;
    }

    const contents = Object.keys(dirNode.children || {});
    if (contents.length === 0) {
        return;
    }

    // Format output (directories append a slash)
    const formattedList = contents.map(name => {
        const item = dirNode.children[name];
        return item.type === 'dir' ? `${name}/` : name;
    }).join('  ');

    terminalState.print(formattedList);
}