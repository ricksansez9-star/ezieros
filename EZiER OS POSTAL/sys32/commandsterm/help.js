// sys32/commandsterm/help.js
export function run(args, terminalState) {
    const commands = [
        { name: 'cd [dir]', desc: 'Change the current working directory' },
        { name: 'ls [dir]', desc: 'List directory contents' },
        { name: 'compile [path]', desc: 'Build project folder into an .ezstaller package' },
        { name: 'clear', desc: 'Clear the terminal screen' },
        { name: 'help', desc: 'Display available terminal commands' }
    ];

    terminalState.print('EZiER OS Shell - Available Commands:');
    terminalState.print('-----------------------------------');

    commands.forEach(cmd => {
        terminalState.print(`${cmd.name.padEnd(18, ' ')} - ${cmd.desc}`);
    });
}