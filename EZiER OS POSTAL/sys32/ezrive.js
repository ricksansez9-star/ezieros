/* ezrive — EZiER virtual drives. Shared by Explorer, Notepad, Media Player and the Terminal.
   Files live in localStorage 'ezier_vfs' (nested objects = folders, strings = file contents;
   images/media are stored as data: URLs). Paths look like  D:/documents/readme.txt  */
(() => {
  const KEY = 'ezier_vfs';
  const DRIVES = { 'C:': { label: 'EZiER OS', root: [] }, 'D:': { label: 'User Data', root: ['user'] } };
  const seed = () => ({ sys32: { 'EZiEROS.html': 'file', 'terminal.html': 'file' }, apps: {},
    user: { documents: { 'readme.txt': 'Welcome to EZiER OS!' }, downloads: {}, pictures: {}, music: {} } });
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { return seed(); } };
  const save = v => localStorage.setItem(KEY, JSON.stringify(v));
  const isDir = n => n && typeof n === 'object';
  const size = n => isDir(n) ? Object.values(n).reduce((a, c) => a + size(c), 0) : String(n).length;
  const parse = p => {
    const m = String(p).replace(/\\/g, '/').match(/^([A-Za-z]:)?\/?(.*)$/), d = (m[1] || 'C:').toUpperCase();
    return { d, parts: [...(DRIVES[d]?.root || []), ...m[2].split('/').filter(Boolean)] };
  };
  const walk = (r, parts) => parts.reduce((n, k) => isDir(n) ? n[k] : undefined, r);
  window.EZRIVE = {
    DRIVES,
    drives: () => { const v = load(); return Object.entries(DRIVES).map(([id, d]) => ({ id, label: d.label, used: size(walk(v, d.root)) })); },
    ls(p) { const n = walk(load(), parse(p).parts); if (!isDir(n)) return null;
      return Object.keys(n).sort((a, b) => (isDir(n[b]) - isDir(n[a])) || a.localeCompare(b)).map(k => ({ name: k, dir: isDir(n[k]), size: size(n[k]) })); },
    read(p) { const n = walk(load(), parse(p).parts); return typeof n === 'string' ? n : null; },
    write(p, c) { const v = load(), parts = parse(p).parts, name = parts.pop(); if (!name) return; let n = v;
      for (const k of parts) { if (!isDir(n[k])) n[k] = {}; n = n[k]; } n[name] = c; save(v); },
    mkdir(p) { const v = load(); let n = v; for (const k of parse(p).parts) { if (!isDir(n[k])) n[k] = {}; n = n[k]; } save(v); },
    rm(p) { const v = load(), parts = parse(p).parts, name = parts.pop(), par = walk(v, parts); if (isDir(par) && name) { delete par[name]; save(v); } },
    exists: p => walk(load(), parse(p).parts) !== undefined,
    open: p => parent.postMessage({ ezOpen: p }, '*'),
  };
  document.head.insertAdjacentHTML('beforeend', '<style>html,body{margin:0;height:100%}body{background:#202020;color:#fff;font:13px "Segoe UI",Inter,system-ui,sans-serif}button,input,select{font:inherit;color:inherit;background:#ffffff14;border:1px solid #ffffff1f;border-radius:5px;padding:5px 11px}button:hover{background:#ffffff24}button.pri{background:#4cc2ff;color:#001;border-color:transparent}input:focus,textarea:focus,select:focus{outline:2px solid #4cc2ff}#bar{display:flex;gap:6px;padding:8px;align-items:center;border-bottom:1px solid #ffffff17}</style>');
})();
