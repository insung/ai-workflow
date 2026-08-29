#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CONTEXT = 120;
const UNION_RULE = '.comments/threads/*.jsonl merge=union';

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function argsOf(argv) {
  const result = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) result._.push(argv[i]);
    else {
      const key = argv[i].slice(2);
      result[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    }
  }
  return result;
}

function git(cwd, args, input) {
  try {
    const result = spawnSync('git', args, { cwd, input, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return result.status === 0 ? result.stdout : null;
  } catch {
    return null;
  }
}

function gitRoot(candidate) {
  const root = git(candidate, ['rev-parse', '--show-toplevel']);
  return root ? path.resolve(root.trim()) : null;
}

function storeRoot(repo) {
  const common = git(repo, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
  return common && path.basename(common.trim()) === '.git' ? path.dirname(common.trim()) : repo;
}

function discoverRepos(workspace, maxDepth) {
  const start = path.resolve(workspace);
  if (!fs.existsSync(start)) fail(`작업공간이 없습니다: ${start}`);
  const roots = new Set();
  const current = gitRoot(start);
  if (current) roots.add(current);
  function walk(dir, depth) {
    if (depth > maxDepth) return;
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const child = path.join(dir, entry.name);
      if (fs.existsSync(path.join(child, '.git'))) {
        const root = gitRoot(child);
        if (root) roots.add(root);
      } else walk(child, depth + 1);
    }
  }
  walk(start, 1);
  const uniqueStores = new Map();
  for (const repo of [...roots].sort()) {
    if (!uniqueStores.has(storeRoot(repo))) uniqueStores.set(storeRoot(repo), repo);
  }
  return [...uniqueStores.values()];
}

function parseLog(text) {
  const seen = new Set();
  return text
    .split('\n')
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((event) => {
      if (!event || typeof event.id !== 'string' || typeof event.type !== 'string' || seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .sort((a, b) => (a.seq || 0) - (b.seq || 0) || String(a.ts).localeCompare(String(b.ts)) || a.id.localeCompare(b.id));
}

function readLog(file) {
  try {
    return parseLog(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function fold(id, events) {
  const created = events.find((event) => event.type === 'created');
  if (!created || typeof created.file !== 'string' || !created.anchor) return null;
  const state = { id, file: created.file, status: 'open', severity: created.severity === 'blocking' ? 'blocking' : 'normal', anchor: created.anchor, comments: [] };
  const comments = new Map();
  for (const event of events) {
    if (event.type === 'created' || event.type === 'replied') {
      const comment = { id: event.commentId || event.id, author: event.actor?.name || 'unknown', body: event.body || '', createdAt: event.ts, deleted: false };
      comments.set(comment.id, comment);
      state.comments.push(comment);
    } else if (event.type === 'edited' && comments.has(event.commentId)) comments.get(event.commentId).body = event.body ?? comments.get(event.commentId).body;
    else if (event.type === 'comment_deleted' && comments.has(event.commentId)) comments.get(event.commentId).deleted = true;
    else if (event.type === 'resolved') state.status = 'resolved';
    else if (event.type === 'reopened') state.status = 'open';
    else if (event.type === 'severity_changed') state.severity = event.severity === 'blocking' ? 'blocking' : 'normal';
    else if (event.type === 'reanchored' && event.anchor) state.anchor = event.anchor;
    else if (event.type === 'renamed' && typeof event.file === 'string') state.file = event.file;
  }
  state.comments = state.comments.filter((comment) => !comment.deleted);
  return state.comments.length ? state : null;
}

function summary(state) {
  return {
    threadId: state.id,
    file: state.file,
    status: state.status,
    severity: state.severity,
    startLine: state.anchor.start.line + 1,
    endLine: state.anchor.end.line + 1,
    anchorText: state.anchor.text,
    comments: state.comments.map(({ author, body, createdAt }) => ({ author, body, createdAt })),
  };
}

function logPath(repo, threadId) {
  if (!/^th_[A-Za-z0-9-]+$/.test(threadId)) throw new Error(`잘못된 스레드 ID입니다: ${threadId}`);
  return path.join(storeRoot(repo), '.comments', 'threads', `${threadId}.jsonl`);
}

function list(repo) {
  const directory = path.join(storeRoot(repo), '.comments', 'threads');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => name.endsWith('.jsonl')).map((name) => fold(name.slice(0, -6), readLog(path.join(directory, name)))).filter(Boolean);
}

function get(repo, threadId) {
  const state = fold(threadId, readLog(logPath(repo, threadId)));
  if (!state) throw new Error(`스레드를 찾지 못했습니다: ${threadId}`);
  return state;
}

function append(log, type, fields) {
  fs.mkdirSync(path.dirname(log), { recursive: true });
  const lock = `${log}.lock`;
  const deadline = Date.now() + 5000;
  let descriptor;
  for (;;) {
    try {
      descriptor = fs.openSync(lock, 'wx');
      break;
    } catch {
      try {
        if (Date.now() - fs.statSync(lock).mtimeMs > 10000) {
          fs.rmSync(lock, { force: true });
          continue;
        }
      } catch {}
      if (Date.now() > deadline) throw new Error(`스레드 잠금 시간이 초과됐습니다: ${log}`);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 15);
    }
  }
  try {
    const seq = readLog(log).reduce((max, event) => Math.max(max, event.seq || 0), 0) + 1;
    const event = { id: `ev_${crypto.randomUUID()}`, type, seq, ts: new Date().toISOString(), actor: { name: 'Codex', kind: 'agent' }, ...fields };
    fs.appendFileSync(log, `${JSON.stringify(event)}\n`, 'utf8');
  } finally {
    fs.closeSync(descriptor);
    fs.rmSync(lock, { force: true });
  }
}

function baseline(repo, file, content) {
  const head = git(repo, ['rev-parse', 'HEAD']);
  if (!head) return null;
  const clean = git(repo, ['status', '--porcelain', '--', file]);
  const tracked = git(repo, ['ls-files', '--error-unmatch', '--', file]);
  if (tracked !== null && clean !== null && clean.trim() === '' && git(repo, ['show', `HEAD:${file}`]) === content) return { kind: 'commit', sha: head.trim() };
  const written = git(repo, ['hash-object', '-w', '--stdin'], content);
  const buffer = Buffer.from(content, 'utf8');
  const fallback = crypto.createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
  return { kind: 'blob', sha: written ? written.trim() : fallback, commit: head.trim() };
}

function anchorFor(repo, args) {
  const absolute = path.resolve(repo, args.file);
  if (!absolute.startsWith(`${repo}${path.sep}`) || !fs.existsSync(absolute)) throw new Error(`저장소 안의 파일이 아닙니다: ${args.file}`);
  const content = fs.readFileSync(absolute, 'utf8');
  const lines = content.split('\n');
  let start;
  let end;
  if (args.anchorText) {
    start = content.indexOf(args.anchorText);
    if (start < 0) throw new Error('파일에서 정확한 앵커 텍스트를 찾지 못했습니다.');
    end = start + args.anchorText.length;
  } else {
    const first = Number(args.startLine);
    const last = Number(args.endLine || args.startLine);
    if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first || last > lines.length) throw new Error('줄 범위가 올바르지 않습니다.');
    start = lines.slice(0, first - 1).reduce((total, line) => total + line.length + 1, 0);
    end = lines.slice(0, last - 1).reduce((total, line) => total + line.length + 1, 0) + lines[last - 1].length;
  }
  function position(offset) {
    let line = 0;
    let consumed = 0;
    while (line < lines.length && consumed + lines[line].length + 1 <= offset) consumed += lines[line++].length + 1;
    return { line, char: offset - consumed };
  }
  const file = args.file.split(path.sep).join('/');
  return { file, anchor: { baseline: baseline(repo, file, content), start: position(start), end: position(end), text: content.slice(start, end), prefix: content.slice(Math.max(0, start - CONTEXT), start), suffix: content.slice(end, end + CONTEXT) } };
}

function ensureUnionRule(repo) {
  const file = path.join(storeRoot(repo), '.gitattributes');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!current.includes(UNION_RULE)) fs.writeFileSync(file, `${current}${current && !current.endsWith('\n') ? '\n' : ''}${UNION_RULE}\n`, 'utf8');
}

function info(repo, workspace) {
  const relative = path.relative(workspace, repo);
  return { name: path.basename(repo), relativePath: relative && !relative.startsWith('..') ? relative : repo, root: repo };
}

function explicitRepo(repos, workspace, selector) {
  if (!selector) return null;
  const wanted = path.resolve(workspace, selector);
  const matches = repos.filter((repo) => repo === wanted || path.basename(repo) === selector || path.relative(workspace, repo) === selector);
  if (matches.length !== 1) fail(`저장소를 하나로 확정할 수 없습니다: ${selector}`);
  return matches[0];
}

function repoForThread(repos, workspace, selector, id) {
  const explicit = explicitRepo(repos, workspace, selector);
  if (explicit) return explicit;
  const matches = repos.filter((repo) => fs.existsSync(logPath(repo, id)));
  if (matches.length === 1) return matches[0];
  if (repos.length === 1) return repos[0];
  fail(`스레드 ${id}의 저장소를 확정할 수 없습니다. --repo를 지정하세요.`);
}

function repoForFile(repos, workspace, selector, file) {
  const explicit = explicitRepo(repos, workspace, selector);
  if (explicit) return explicit;
  const matches = repos.filter((repo) => fs.existsSync(path.join(repo, file)));
  if (matches.length === 1) return matches[0];
  if (repos.length === 1) return repos[0];
  fail(`파일 ${file}의 저장소를 확정할 수 없습니다. --repo를 지정하세요.`);
}

function required(args, key) {
  if (!args[key] || args[key] === true) fail(`--${key} 값이 필요합니다.`);
  return args[key];
}

function print(repo, workspace, value) {
  process.stdout.write(`${JSON.stringify({ repository: info(repo, workspace), ...value }, null, 2)}\n`);
}

function main() {
  const args = argsOf(process.argv.slice(2));
  const command = args._[0];
  if (!command || args.help) return process.stdout.write('commands: repos | list | get | reply | create\n');
  const workspace = path.resolve(args.workspace || process.cwd());
  const repos = discoverRepos(workspace, args.depth ? Number(args.depth) : 2);
  if (!repos.length) fail(`Git 저장소를 찾지 못했습니다: ${workspace}`);
  if (command === 'repos') return process.stdout.write(`${JSON.stringify(repos.map((repo) => info(repo, workspace)), null, 2)}\n`);
  if (command === 'list') {
    const selected = explicitRepo(repos, workspace, args.repo);
    const result = [];
    for (const repo of selected ? [selected] : repos) for (const state of list(repo)) {
      if ((!args.status || state.status === args.status) && (!args.file || state.file === args.file)) result.push({ repository: info(repo, workspace), ...summary(state) });
    }
    return process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
  if (command === 'get') {
    const id = required(args, 'thread');
    const repo = repoForThread(repos, workspace, args.repo, id);
    return print(repo, workspace, summary(get(repo, id)));
  }
  if (command === 'reply') {
    const id = required(args, 'thread');
    const repo = repoForThread(repos, workspace, args.repo, id);
    get(repo, id);
    append(logPath(repo, id), 'replied', { commentId: `c_${crypto.randomUUID()}`, body: required(args, 'body') });
    return print(repo, workspace, summary(get(repo, id)));
  }
  if (command === 'create') {
    const file = required(args, 'file');
    const repo = repoForFile(repos, workspace, args.repo, file);
    const anchored = anchorFor(repo, { file, anchorText: args['anchor-text'], startLine: args['start-line'], endLine: args['end-line'] });
    ensureUnionRule(repo);
    const id = `th_${crypto.randomUUID()}`;
    append(logPath(repo, id), 'created', { version: 2, file: anchored.file, anchor: anchored.anchor, body: required(args, 'body'), commentId: `c_${crypto.randomUUID()}`, severity: args.severity === 'blocking' ? 'blocking' : 'normal' });
    return print(repo, workspace, summary(get(repo, id)));
  }
  fail(`알 수 없는 명령입니다: ${command}`);
}

try {
  main();
} catch (error) {
  fail(error.message);
}
