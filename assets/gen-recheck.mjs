#!/usr/bin/env node
/*
 * 复检卷生成器 · shuyi-learning / references/11-recheck.md 的参考实现
 *
 * 用法：
 *   node gen-recheck.mjs dump  <错题本.html> [题号...]
 *       从错题本抽出题目数据，打印精简视图 + 写出 items.json 供填答案
 *   node gen-recheck.mjs build <错题本.html> <卷号N> <数据模块.mjs>
 *       生成 <章目录>/复检/第N次复检.html
 *
 * 数据模块格式（可用 String.raw 写 LaTeX，避免转义）：
 *   export default [
 *     { g:'记账失守', key:'T01', no:'01', lv:'易', xn:'×2', kind:'原题',
 *       src:'…', stem:'…', steps:'三步要点', answer:'答案', err:'上次错在' }
 *   ];
 *
 * KaTeX 资源从当章错题本原位抽取，不另存副本；页面完全自包含，可离线打开。
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function extractArray(s, key) {
  const at = s.indexOf('const ' + key);
  if (at < 0) throw new Error('未找到 const ' + key);
  const start = s.indexOf('[', at);
  let depth = 0, q = null, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '[' || c === '{' || c === '(') { depth++; continue; }
    if (c === ']' || c === '}' || c === ')') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  throw new Error('PROBLEMS 括号未配平');
}

export function loadProblems(file) {
  const src = fs.readFileSync(file, 'utf8');
  return new Function('return ' + extractArray(src, 'PROBLEMS'))();
}

function grabKatex(src) {
  const L = src.split(/\r?\n/);
  const cssIdx = L.findIndex(l => l.includes('id="katex-css"'));
  const css = cssIdx >= 0 ? L[cssIdx + 1] : null;
  const js = L.find(l => l.length > 100000 && l.includes('katex')
    && !l.includes('@font-face') && !l.includes('data:font'));
  const ar = L.find(l => l.includes('renderMathInElement') && l.length < 20000);
  if (!css || !css.includes('font-face')) throw new Error('katex CSS 定位失败');
  if (!js) throw new Error('katex 主库定位失败');
  if (!ar) throw new Error('auto-render 定位失败');
  return { css, js, ar };
}

const strip = h => String(h)
  .replace(/<br\s*\/?>/g, ' ')
  .replace(/<\/(p|li|div|h[1-6])>/g, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();

function dump(file, only) {
  const P = loadProblems(file);
  const pick = only.length ? P.filter(p => only.includes(p.no)) : P;
  console.log('题数 ' + P.length + '，选中 ' + pick.length);
  for (const p of pick) {
    console.log('\n##### ' + p.no + ' | ' + (p.level || '-') + ' | ' + p.mode + ' #####');
    console.log('TITLE ' + p.title);
    console.log('SRC   ' + p.source);
    console.log('ERR   ' + p.err);
    console.log('STEM  ' + p.stem);
    console.log('STEPS ' + (p.steps || []).map((s, i) => (i + 1) + '.' + s.name).join(' '));
    console.log('SOL   ' + strip(p.solution || '').slice(0, 300));
    if (p.practice && p.practice.q) {
      console.log('PRA_Q ' + p.practice.q);
      console.log('PRA_A ' + strip(p.practice.a || '').slice(0, 260));
    }
  }
}

async function build(srcFile, round, dataFile) {
  const items = (await import(pathToFileURL(path.resolve(dataFile)).href)).default;
  const src = fs.readFileSync(srcFile, 'utf8');
  const { css: katexCss, js: katexJs, ar: autoRender } = grabKatex(src);
  const chDir = path.dirname(path.resolve(srcFile));
  const book = bookName(chDir);
  const outDir = path.join(chDir, '复检');
  const out = path.join(outDir, '第' + round + '次复检.html');
  if (fs.existsSync(out)) throw new Error('已存在 ' + out + '，复检卷不复用旧文件名，请核对卷号');

  const P = loadProblems(srcFile);
  for (const it of items) {
    const p = P.find(x => x.no === it.key);
    if (!p) throw new Error('错题本中找不到 ' + it.key);
    if (it.kind === '变式') {
      if (!p.practice || !p.practice.q) throw new Error(it.key + ' 没有 practice 变式，改标原题或另编');
      it.stem = p.practice.q;
      it.src = '错题本 ' + it.key + ' 同型变式';
    } else {
      it.stem = p.stem;
      it.src = p.source;
    }
  }

  const titles = [...new Set(items.map(i => i.g))];
  const groups = titles.map(t => ({ name: t, items: items.filter(i => i.g === t) }));
  const esc = s => String(s).replace(/&(?![a-z#]+;)/g, '&amp;');
  const tagOf = it => it.kind === '变式'
    ? '<span class="tag var">变式</span>'
    : (it.xn === '空' ? '<span class="tag blank">空题</span>' : '');

  const body = groups.map(g => `
<section class="grp">
  <h2>${g.name} <em>${g.items.length} 题</em></h2>
${g.items.map(it => `
  <article class="q" id="q${it.no}">
    <div class="qh">
      <b>${it.no}</b>
      <span class="no">${it.key}</span>
      <span class="tag lv">${it.lv}</span>
      ${tagOf(it)}
      <span class="xn">${it.xn === '空' ? '未作答' : it.xn}</span>
    </div>
    <div class="stem">${esc(it.stem)}</div>
    <div class="src">${esc(it.src)}</div>
    <button class="reveal" data-q="${it.no}">写完，对答案</button>
    <div class="ans" id="a${it.no}" hidden>
      <div class="row"><span class="k">三步</span><div class="v">${it.steps}</div></div>
      <div class="row"><span class="k">答案</span><div class="v">${it.answer}</div></div>
      <div class="row warn"><span class="k">上次错在</span><div class="v">${it.err}</div></div>
      <div class="judge" data-q="${it.no}">
        <button data-j="pass">独立过</button>
        <button data-j="hint">提示过</button>
        <button data-j="fail">未过</button>
      </div>
    </div>
  </article>`).join('')}
</section>`).join('');

  const head = titles.map(t => t + ' ' + items.filter(i => i.g === t).length + ' 题').join(' · ');

  const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>第 ${round} 次复检</title>
<style>${CSS}</style>
<style id="katex-css">${katexCss}</style>
</head>
<body>
<header class="hd">
  <div class="hdw">
    <a class="back" href="../${path.basename(srcFile)}">错题本</a>
    <div class="tt"><h1>第 ${round} 次复检</h1><p>${esc(book)} · ${items.length} 题 · 闭卷 · 约 25 分钟</p></div>
    <div class="dots" id="dots"></div>
  </div>
</header>
<main>
  <div class="lead"><b>本次主查</b>　${esc(head)}<span class="rule">选择、填空、单步计算须独立过；解答与证明题独立过，或能说清第一步与所用方法。</span></div>
${body}
</main>
<footer class="ft"><div class="ftw"><span id="stat">已评 0 / ${items.length}</span><button id="copy">复制回填</button></div></footer>
<script>${katexJs}</script>
<script>${autoRender}</script>
<script>${SCRIPT.replace('__ROUND__', round).replace('__ITEMS__', JSON.stringify(items.map(i => ({ no: i.no, key: i.key, root: i.g, kind: i.kind }))))}</script>
</body>
</html>`;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(out, page, 'utf8');
  console.log('已生成 ' + out + '（' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB，' + items.length + ' 题 / ' + groups.length + ' 组）');
}

const CSS = fs.readFileSync(new URL('./recheck.css', import.meta.url), 'utf8');
const SCRIPT = fs.readFileSync(new URL('./recheck.client.js', import.meta.url), 'utf8');

function bookName(chDir) {
  const base = path.basename(chDir);
  const m = base.match(/^(\d+)_(.+)$/);
  if (!m) return base;
  const cn = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const n = parseInt(m[1], 10);
  const num = n < 10 ? cn[n] : (n === 10 ? '十' : (n < 20 ? '十' + cn[n % 10] : '二十'));
  return '第' + num + '章 · ' + m[2];
}

const [mode, a1, a2, a3] = process.argv.slice(2);
if (mode === 'dump' && a1) dump(a1, process.argv.slice(4));
else if (mode === 'build' && a1 && a2 && a3) await build(a1, a2, a3);
else {
  console.log('用法：\n  node gen-recheck.mjs dump  <错题本.html> [题号...]\n  node gen-recheck.mjs build <错题本.html> <卷号N> <数据模块.mjs>');
  process.exit(1);
}
