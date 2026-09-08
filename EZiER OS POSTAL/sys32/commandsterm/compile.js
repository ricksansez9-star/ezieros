/**
 * Command: compile
 * Usage: compile <app-folder> [options]
 * Example: compile /apps/my-app --entry index.html --name "My Cool App"
 */
export async function execute(args, vfs, terminal) {
    const flags = parseArgs(args);
    const targetDir = flags._[0];

    if (!targetDir) {
        terminal.error("Usage: compile <app-directory> [--name Name] [--entry main.html]");
        return;
    }

    // 1. Resolve source path in Virtual File System
    const appPath = vfs.resolvePath(targetDir);
    if (!vfs.exists(appPath) || !vfs.isDirectory(appPath)) {
        terminal.error(`Directory not found: ${targetDir}`);
        return;
    }

    terminal.print(`Packaging directory: ${appPath}...`);

    // 2. Scan VFS directory recursively
    const files = vfs.readDirRecursive(appPath); // Returns [{ relPath: 'index.html', content: Blob|String }]
    if (files.length === 0) {
        terminal.error("Compilation failed: Target directory is empty.");
        return;
    }

    // 3. Auto-detect entry point if not passed in flags
    let entryFile = flags.entry || flags.e;
    if (!entryFile) {
        const defaultEntry = files.find(f => /(^|\/)index\.html?$/i.test(f.relPath));
        entryFile = defaultEntry ? defaultEntry.relPath : files[0].relPath;
    }

    // 4. Construct manifest
    const folderName = appPath.split('/').pop();
    const appId = flags.id || slugify(folderName);
    const manifest = {
        ezstaller: 1,
        id: appId,
        name: flags.name || folderName,
        version: flags.version || "1.0.0",
        author: flags.author || "EZiER Developer",
        description: flags.desc || "",
        entry: entryFile,
        icon: flags.icon || undefined
    };

    // Remove undefined properties
    Object.keys(manifest).forEach(k => manifest[k] === undefined && delete manifest[k]);

    // 5. Package files using JSZip
    try {
        const zip = new JSZip();
        zip.file("ezstaller.json", JSON.stringify(manifest, null, 2));

        for (const file of files) {
            zip.file(file.relPath, file.content);
        }

        terminal.print("Compressing package...");
        const blob = await zip.generateAsync({ type: "blob" });

        // 6. Save back to VFS (or download directly)
        const outputPath = `/sys32/builds/${appId}.ezstaller`;
        await vfs.writeFile(outputPath, blob);

        terminal.success(`Successfully compiled ${appId}.ezstaller!`);
        terminal.print(`Saved to: ${outputPath}`);
    } catch (err) {
        terminal.error(`Build failed: ${err.message}`);
    }
}

// Utility: Basic CLI flag parser
function parseArgs(args) {
    const result = { _: [] };
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].slice(2);
            const val = args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : true;
            result[key] = val;
        } else {
            result._.push(args[i]);
        }
    }
    return result;
}

function slugify(s) {
    return String(s || '').toLowerCase().trim()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'app';
}
export default function (args, terminal) {
    const targetFolder = args[0]; // "/Program Files/"

    terminal.print(`Compiling ${targetFolder}...`);
    // Runs JSZip packing logic here...
    terminal.print(`Done!`);
}