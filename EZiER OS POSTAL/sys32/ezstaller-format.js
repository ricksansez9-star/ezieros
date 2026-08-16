/* ═══════════════════════════════════════════════════════════════
 * ezstaller-format.js
 * ───────────────────────────────────────────────────────────────
 * Defines the .ezstaller application package format for EZiER OS,
 * and the logic to read, validate, and install one.
 *
 * WHAT IS A .ezstaller FILE?
 * It's a plain ZIP archive — the exact same kind EZiER OS already
 * knows how to open in the graphical App Installer — with one
 * addition: a manifest file named "ezstaller.json" at its root.
 * That manifest is what lets the Console Installer install the app
 * automatically (name, icon, version, entry point) instead of
 * asking a human to fill out a form.
 *
 * MINIMAL PACKAGE LAYOUT
 *   my-app.ezstaller          (a ZIP file, just renamed)
 *   ├─ ezstaller.json         (required — see fields below)
 *   ├─ index.html             (required — your app's entry point)
 *   ├─ style.css              (optional — anything your app needs)
 *   └─ icon.png               (optional)
 *
 * ezstaller.json FIELDS
 *   ezstaller    number   Format version this package targets. (1)
 *   id           string   Unique slug. Letters/numbers/._- only.   *required*
 *   name         string   Display name shown in the Start Menu.    *required*
 *   entry        string   Path (inside the package) to the html
 *                         file EZiER OS should load.                *required*
 *   version      string   Shown by `info` / during install.
 *   author       string   Shown by `info` / during install.
 *   description  string   Shown by `info`.
 *   icon         string   Path inside the package, OR a full
 *                         http(s)/data URL. Falls back to EZiER
 *                         OS's missing-icon image if omitted.
 *
 * This file depends on JSZip, which EZiER OS already loads in
 * <head> for its own ZIP-based app installs — no extra dependency
 * needed if you're dropping this into the stock EZiER OS page.
 * ═══════════════════════════════════════════════════════════════ */
(function (global) {
    'use strict';

    const FORMAT_VERSION = 1;
    const MANIFEST_FILENAME = 'ezstaller.json';
    const FALLBACK_ICON = '../sys64/icons/MISSING_ICON.png';

    class EzstallerError extends Error {}

    // ── path helpers ──────────────────────────────────────────
    function stripLeadingDot(p) {
        return String(p || '').replace(/^\.\//, '');
    }

    function dirname(path) {
        const i = path.lastIndexOf('/');
        return i === -1 ? '' : path.slice(0, i + 1);
    }

    function escapeRegExp(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ── zip loading ───────────────────────────────────────────
    async function loadZip(file) {
        if (typeof JSZip === 'undefined') {
            throw new EzstallerError('JSZip is not loaded on this page — cannot read .ezstaller packages.');
        }
        try {
            return await JSZip.loadAsync(file);
        } catch (err) {
            throw new EzstallerError('That file is not a valid .ezstaller package (could not open it as a ZIP archive).');
        }
    }

    // ── manifest ──────────────────────────────────────────────
    function findManifestPath(zip) {
        const candidates = Object.keys(zip.files).filter(
            name => !zip.files[name].dir && name.toLowerCase().endsWith(MANIFEST_FILENAME)
        );
        if (candidates.length === 0) return null;
        // Prefer the shallowest match in case the package was zipped
        // up from inside a wrapping folder.
        candidates.sort((a, b) => a.split('/').length - b.split('/').length);
        return candidates[0];
    }

    async function readManifest(zip) {
        const manifestPath = findManifestPath(zip);
        if (!manifestPath) {
            throw new EzstallerError(`Missing ${MANIFEST_FILENAME} — this doesn't look like a .ezstaller package.`);
        }
        const basePath = dirname(manifestPath);
        let raw;
        try {
            raw = await zip.file(manifestPath).async('string');
        } catch (err) {
            throw new EzstallerError(`Could not read ${MANIFEST_FILENAME} from the package.`);
        }
        let manifest;
        try {
            manifest = JSON.parse(raw);
        } catch (err) {
            throw new EzstallerError(`${MANIFEST_FILENAME} is not valid JSON.`);
        }
        return { manifest, basePath };
    }

    function validateManifest(manifest) {
        if (!manifest || typeof manifest !== 'object') {
            throw new EzstallerError(`${MANIFEST_FILENAME} must contain a JSON object.`);
        }
        const required = ['id', 'name', 'entry'];
        const missing = required.filter(
            key => !manifest[key] || typeof manifest[key] !== 'string' || !manifest[key].trim()
        );
        if (missing.length) {
            throw new EzstallerError(`${MANIFEST_FILENAME} is missing required field(s): ${missing.join(', ')}.`);
        }
        if (manifest.ezstaller !== undefined && Number(manifest.ezstaller) > FORMAT_VERSION) {
            throw new EzstallerError(
                `This package needs ezstaller format v${manifest.ezstaller}, but this OS only supports up to v${FORMAT_VERSION}. Update EZiER OS's Console Installer first.`
            );
        }
        if (!/^[a-zA-Z0-9_.\-]+$/.test(manifest.id)) {
            throw new EzstallerError(`App id "${manifest.id}" may only contain letters, numbers, dots, dashes and underscores.`);
        }
    }

    // ── asset extraction ──────────────────────────────────────
    async function extractAllAsBlobUrls(zip, basePath) {
        const map = {}; // relative path (from basePath) -> blob: URL
        const entries = Object.keys(zip.files).filter(
            name => !zip.files[name].dir && name.startsWith(basePath)
        );
        for (const name of entries) {
            const relPath = name.slice(basePath.length);
            if (!relPath || relPath.toLowerCase() === MANIFEST_FILENAME) continue;
            const blob = await zip.files[name].async('blob');
            map[relPath] = URL.createObjectURL(blob);
        }
        return map;
    }

    // Best-effort rewriter: swaps in-package relative references
    // (src="style.css", href='./icon.png', url(bg.png)) for the blob
    // URLs of the extracted files, so a package's own html/css can
    // reference its own assets normally. This is a string-level
    // pass, not a real virtual filesystem — relative paths fetched
    // dynamically from an app's own JavaScript won't be caught.
    function rewriteRelativeReferences(html, entryRelPath, blobMap) {
        let out = html;
        Object.keys(blobMap).forEach(relPath => {
            if (relPath === entryRelPath) return;
            const blobUrl = blobMap[relPath];
            const variants = new Set([relPath, './' + relPath, relPath.split('/').pop()]);
            variants.forEach(variant => {
                if (!variant) return;
                const re = new RegExp('([="\'(])' + escapeRegExp(variant) + '([")\'])', 'g');
                out = out.replace(re, `$1${blobUrl}$2`);
            });
        });
        return out;
    }

    async function buildEntryAndIcon(zip, manifest, basePath, blobMap) {
        const entryRelPath = stripLeadingDot(manifest.entry);
        const entryFile = zip.file(basePath + entryRelPath);
        if (!entryFile) {
            throw new EzstallerError(`Entry file "${manifest.entry}" was not found inside the package.`);
        }
        const rawHtml = await entryFile.async('string');
        const rewritten = rewriteRelativeReferences(rawHtml, entryRelPath, blobMap);
        const entryUrl = URL.createObjectURL(new Blob([rewritten], { type: 'text/html' }));

        let iconUrl = FALLBACK_ICON;
        if (manifest.icon) {
            if (/^https?:\/\//i.test(manifest.icon) || manifest.icon.startsWith('data:')) {
                iconUrl = manifest.icon;
            } else {
                const iconRel = stripLeadingDot(manifest.icon);
                if (blobMap[iconRel]) iconUrl = blobMap[iconRel];
            }
        }
        return { entryUrl, iconUrl };
    }

    // ── reading a package without installing it ──────────────
    async function parsePackage(file) {
        const zip = await loadZip(file);
        const { manifest, basePath } = await readManifest(zip);
        validateManifest(manifest);
        const blobMap = await extractAllAsBlobUrls(zip, basePath);
        const { entryUrl, iconUrl } = await buildEntryAndIcon(zip, manifest, basePath, blobMap);
        return { manifest, entryUrl, iconUrl };
    }

    // ── registering with EZiER OS's existing custom-app store ─
    function registerApp(manifest, entryUrl, iconUrl) {
        if (typeof getCustomApps !== 'function' || typeof saveCustomApps !== 'function') {
            throw new EzstallerError("EZiER OS's app registry isn't available on this page.");
        }
        const id = 'ez-' + manifest.id;
        const apps = getCustomApps().filter(a => a.id !== id); // reinstalling replaces the old copy
        const record = {
            id,
            name: manifest.name,
            icon: iconUrl,
            file: entryUrl,
            custom: true,
            ezstaller: true,
            version: manifest.version || '',
            author: manifest.author || '',
            description: manifest.description || ''
        };
        apps.push(record);
        saveCustomApps(apps);
        if (typeof renderOS === 'function') renderOS();
        if (typeof renderCustomAppList === 'function') renderCustomAppList();
        return record;
    }

    // ── full install pipeline, with optional progress callback ─
    async function installApp(file, onProgress) {
        const progress = typeof onProgress === 'function' ? onProgress : () => {};
        progress('Reading package…');
        const zip = await loadZip(file);

        progress('Locating ezstaller.json…');
        const { manifest, basePath } = await readManifest(zip);
        validateManifest(manifest);
        progress(`Found "${manifest.name}"${manifest.version ? ' v' + manifest.version : ''}${manifest.author ? ' by ' + manifest.author : ''}`);

        progress('Extracting package contents…');
        const blobMap = await extractAllAsBlobUrls(zip, basePath);
        const { entryUrl, iconUrl } = await buildEntryAndIcon(zip, manifest, basePath, blobMap);

        progress('Registering application with EZiER OS…');
        const record = registerApp(manifest, entryUrl, iconUrl);

        if (typeof runAntivirusScan === 'function') {
            progress('Running EZiER Defender scan…');
            runAntivirusScan(manifest.name);
        }
        return record;
    }

    global.Ezstaller = {
        FORMAT_VERSION,
        MANIFEST_FILENAME,
        EzstallerError,
        parsePackage,
        installApp,
        registerApp
    };
})(window);
