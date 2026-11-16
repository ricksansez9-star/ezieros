export function run(args, term) {
  const t = (Array.isArray(args) ? args[0] : String(args || '')).toLowerCase();
  if (t === 'light' || t === 'dark') { parent.postMessage({ ezTheme: t }, '*'); term.print(`Theme set to ${t}.`, 'info'); }
  else term.print('Usage: theme <light|dark>', 'err');
}
