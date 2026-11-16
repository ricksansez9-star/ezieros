export async function run(args, term) {
  const q = (Array.isArray(args) ? args.join(' ') : String(args || '')).trim();
  if (!q) return term.print('Usage: install <store app name | https://url>', 'err');
  let app;
  if (/^https?:\/\//i.test(q)) app = { name: q.replace(/^https?:\/\/(www\.)?/, '').split(/[/?#]/)[0], url: q };
  else {
    try { app = (await (await fetch('./ezstore.json')).json()).apps.find(a => a.name.toLowerCase() === q.toLowerCase()); }
    catch { return term.print('Could not read the store feed (ezstore.json).', 'err'); }
    if (!app) return term.print(`No app named "${q}" in the store.`, 'err');
  }
  parent.postMessage({ ezInstall: app }, '*');
  term.print(`Installing ${app.name}...`, 'info');
}
