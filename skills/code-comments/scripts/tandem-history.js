#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const UNION_RULE = '.comments/tandem/threads/*.jsonl merge=union';

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function argsOf(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith('--')) result._.push(argv[index]);
    else {
      const key = argv[index].slice(2);
      result[key] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true;
    }
  }
  return result;
}

function required(args, key) {
  if (!args[key] || args[key] === true) fail(`--${key} 값이 필요합니다.`);
  return args[key];
}

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return result.status === 0 ? result.stdout : null;
}

function gitRoot(candidate) {
  const root = git(candidate, ['rev-parse', '--show-toplevel']);
  if (!root) fail(`Git 저장소를 확인할 수 없습니다: ${candidate}`);
  return path.resolve(root.trim());
}

function parseBlock(content) {
  const opening = /^```tandem-comments\r?\n/m.exec(content);
  if (!opening) return null;
  const start = opening.index + opening[0].length;
  const rest = content.slice(start);
  const closing = /\r?\n```(?:\r?\n|$)/.exec(rest);
  if (!closing) throw new Error('tandem-comments 닫는 코드 블록이 없습니다.');
  const raw = rest.slice(0, closing.index).split(/\r?\n/).filter((line) => !line.trimStart().startsWith('//')).join('\n');
  return JSON.parse(raw);
}

function walkMarkdown(root) {
  const result = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.isFile() && entry.name.endsWith('.md')) result.push(target);
    }
  }
  walk(root);
  return result;
}

function historyPath(repo, threadId) {
  if (!/^[A-Za-z0-9_-]+$/.test(threadId)) throw new Error(`잘못된 코멘트 ID입니다: ${threadId}`);
  return path.join(repo, '.comments', 'tandem', 'threads', `${threadId}.jsonl`);
}

function readEvents(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

function append(file, event) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const lock = `${file}.lock`;
  let descriptor;
  try {
    descriptor = fs.openSync(lock, 'wx');
    fs.appendFileSync(file, `${JSON.stringify(event)}\n`, 'utf8');
  } finally {
    if (descriptor !== undefined) {
      fs.closeSync(descriptor);
      fs.rmSync(lock, { force: true });
    }
  }
}

function ensureUnionRule(repo) {
  const file = path.join(repo, '.gitattributes');
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!current.includes(UNION_RULE)) fs.writeFileSync(file, `${current}${current && !current.endsWith('\n') ? '\n' : ''}${UNION_RULE}\n`, 'utf8');
}

function archiveThread(repo, file, threadId, data, source, documentState) {
  const snapshot = { file, status: data.status, anchor: data.anchor, thread: data.thread, suggestion: data.suggestion };
  const digest = crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
  const log = historyPath(repo, threadId);
  const previous = readEvents(log).filter((event) => event.type === 'snapshot');
  if (previous.some((event) => event.digest === digest)) return false;
  append(log, {
    version: 1,
    type: 'snapshot',
    capturedAt: new Date().toISOString(),
    source,
    documentState,
    threadId,
    digest,
    data: snapshot,
  });
  return true;
}

function archiveContent(repo, relativeFile, content, source, documentState) {
  const threads = parseBlock(content);
  if (!threads) return { found: 0, appended: 0 };
  let appended = 0;
  for (const [threadId, data] of Object.entries(threads)) if (archiveThread(repo, relativeFile, threadId, data, source, documentState)) appended += 1;
  return { found: Object.keys(threads).length, appended };
}

function archiveWorkingTree(repo, scanRoot) {
  let found = 0;
  let appended = 0;
  for (const file of walkMarkdown(scanRoot)) {
    const relative = path.relative(repo, file).split(path.sep).join('/');
    const result = archiveContent(repo, relative, fs.readFileSync(file, 'utf8'), 'working-tree', 'present');
    found += result.found;
    appended += result.appended;
  }
  return { found, appended };
}

function archiveGitRef(repo, ref) {
  const names = git(repo, ['ls-tree', '-r', '--name-only', ref]);
  if (names === null) fail(`Git 참조를 읽을 수 없습니다: ${ref}`);
  let found = 0;
  let appended = 0;
  for (const file of names.split('\n').filter((name) => name.endsWith('.md'))) {
    const content = git(repo, ['show', `${ref}:${file}`]);
    if (content === null) continue;
    const result = archiveContent(repo, file, content, `git:${ref}`, 'historical');
    found += result.found;
    appended += result.appended;
  }
  return { found, appended };
}

function listHistory(repo) {
  const directory = path.join(repo, '.comments', 'tandem', 'threads');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => name.endsWith('.jsonl')).sort().map((name) => {
    const events = readEvents(path.join(directory, name));
    const latest = events.filter((event) => event.type === 'snapshot').at(-1);
    const resolution = events.filter((event) => event.type === 'resolution-observed').at(-1);
    return {
      threadId: name.slice(0, -6),
      file: latest?.data?.file,
      capturedAt: latest?.capturedAt,
      source: latest?.source,
      documentState: latest?.documentState,
      statusAtCapture: latest?.data?.status,
      currentState: resolution && resolution.capturedAt >= latest.capturedAt ? 'resolved' : latest?.data?.status,
      commentCount: latest?.data?.thread?.length || 0,
      snapshots: events.filter((event) => event.type === 'snapshot').length,
    };
  });
}

function currentThreads(repo) {
  const directory = path.join(repo, '.comments', 'tandem', 'threads');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((name) => name.endsWith('.jsonl')).sort().flatMap((name) => {
    const events = readEvents(path.join(directory, name));
    const latest = events.filter((event) => event.type === 'snapshot').at(-1);
    if (!latest) return [];
    const resolution = events.filter((event) => event.type === 'resolution-observed').at(-1);
    return [{
      threadId: name.slice(0, -6),
      file: latest.data.file,
      capturedAt: latest.capturedAt,
      currentState: resolution && resolution.capturedAt >= latest.capturedAt ? 'resolved' : latest.data.status,
      anchor: latest.data.anchor,
      comments: latest.data.thread || [],
    }];
  });
}

function quoteMarkdown(value) {
  return String(value || '').split(/\r?\n/).map((line) => `> ${line}`).join('\n');
}

function renderMarkdown(repo) {
  const grouped = new Map();
  for (const thread of currentThreads(repo)) {
    if (!grouped.has(thread.file)) grouped.set(thread.file, []);
    grouped.get(thread.file).push(thread);
  }
  const lines = [
    '# Tandem 코멘트 기록',
    '',
    '이 문서는 Obsidian에서 해결된 코멘트 대화를 읽기 위한 생성본이다. 정본은 `.comments/tandem/threads/`의 append-only 기록이며, 이 파일을 직접 수정하지 않는다.',
    '',
  ];
  for (const file of [...grouped.keys()].sort()) {
    lines.push(`## ${file}`, '');
    for (const thread of grouped.get(file)) {
      lines.push(`### ${thread.threadId} · ${thread.currentState}`, '', `- 마지막 보관: ${thread.capturedAt}`, `- 앵커: ${thread.anchor?.exact || '(없음)'}`, '');
      for (const comment of thread.comments) {
        lines.push(`#### ${comment.author} · ${comment.ts}`, '', quoteMarkdown(comment.text), '');
      }
    }
  }
  if (grouped.size === 0) lines.push('보관된 Tandem 코멘트가 없다.', '');
  return `${lines.join('\n').trimEnd()}\n`;
}

function exportMarkdown(repo, output) {
  const target = path.resolve(repo, output);
  const relative = path.relative(repo, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) fail('--output은 저장소 안의 파일이어야 합니다.');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, renderMarkdown(repo), 'utf8');
  return relative.split(path.sep).join('/');
}

function main() {
  const args = argsOf(process.argv.slice(2));
  const command = args._[0];
  if (!command || args.help) return process.stdout.write('commands: archive | archive-git | mark-resolved | list | export-markdown\n');
  const scanRoot = path.resolve(required(args, 'root'));
  const repo = gitRoot(scanRoot);
  if (command === 'archive') {
    ensureUnionRule(repo);
    return process.stdout.write(`${JSON.stringify({ repository: repo, source: 'working-tree', ...archiveWorkingTree(repo, scanRoot) }, null, 2)}\n`);
  }
  if (command === 'archive-git') {
    ensureUnionRule(repo);
    const ref = args.ref && args.ref !== true ? args.ref : 'HEAD';
    return process.stdout.write(`${JSON.stringify({ repository: repo, source: `git:${ref}`, ...archiveGitRef(repo, ref) }, null, 2)}\n`);
  }
  if (command === 'mark-resolved') {
    const threadIds = required(args, 'threads').split(',').map((value) => value.trim()).filter(Boolean);
    for (const threadId of threadIds) {
      const log = historyPath(repo, threadId);
      if (!fs.existsSync(log)) fail(`보관된 코멘트가 없습니다: ${threadId}`);
      append(log, {
        version: 1,
        type: 'resolution-observed',
        capturedAt: new Date().toISOString(),
        source: args.source && args.source !== true ? args.source : 'user-report',
        threadId,
      });
    }
    return process.stdout.write(`${JSON.stringify({ repository: repo, resolved: threadIds }, null, 2)}\n`);
  }
  if (command === 'list') return process.stdout.write(`${JSON.stringify(listHistory(repo), null, 2)}\n`);
  if (command === 'export-markdown') {
    const output = exportMarkdown(repo, required(args, 'output'));
    return process.stdout.write(`${JSON.stringify({ repository: repo, output, threads: currentThreads(repo).length }, null, 2)}\n`);
  }
  fail(`알 수 없는 명령입니다: ${command}`);
}

try {
  main();
} catch (error) {
  fail(error.message);
}
