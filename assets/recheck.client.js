(function () {
  var ROUND = '__ROUND__';
  var KEY = 'recheck::' + location.pathname;
  var ALL = __ITEMS__;
  var st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { st = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

  var dots = document.getElementById('dots');
  ALL.forEach(function () { dots.appendChild(document.createElement('i')); });
  var stat = document.getElementById('stat');

  function paint() {
    var n = 0, p = 0, h = 0, f = 0;
    ALL.forEach(function (it, i) {
      var r = st[it.no] || {};
      var judged = !!r.j;
      if (judged) { n++; if (r.j === 'pass') p++; else if (r.j === 'hint') h++; else f++; }
      dots.children[i].className = judged ? 'on' : (r.open ? 'mid' : '');
    });
    stat.textContent = '已评 ' + n + ' / ' + ALL.length + '　独立过 ' + p + ' · 提示过 ' + h + ' · 未过 ' + f;
  }

  if (location.hash === '#all') {
    document.querySelectorAll('.reveal').forEach(function (b) {
      var q = b.getAttribute('data-q');
      document.getElementById('a' + q).hidden = false;
      b.disabled = true;
      b.textContent = '已揭晓';
      st[q] = st[q] || {};
      st[q].open = 1;
    });
    save();
  }

  document.querySelectorAll('.reveal').forEach(function (btn) {
    var q = btn.getAttribute('data-q'), box = document.getElementById('a' + q);
    if (st[q] && st[q].open) { box.hidden = false; btn.disabled = true; btn.textContent = '已揭晓'; }
    btn.addEventListener('click', function () {
      box.hidden = false; btn.disabled = true; btn.textContent = '已揭晓';
      st[q] = st[q] || {}; st[q].open = 1; save();
    });
  });

  document.querySelectorAll('.judge').forEach(function (box) {
    var q = box.getAttribute('data-q');
    box.querySelectorAll('button').forEach(function (b) {
      if (st[q] && st[q].j === b.getAttribute('data-j')) b.setAttribute('aria-pressed', 'true');
      b.addEventListener('click', function () {
        box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        st[q] = st[q] || {}; st[q].j = b.getAttribute('data-j'); st[q].t = Date.now();
        save(); paint();
      });
    });
  });

  document.getElementById('copy').addEventListener('click', function () {
    var d = new Date(), p2 = function (n) { return String(n).padStart(2, '0'); };
    var day = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
    var map = { pass: '独立过', hint: '提示过', fail: '未过' };
    var lines = ['第 ' + ROUND + ' 次复检 · ' + day];
    ALL.forEach(function (it) {
      var r = st[it.no];
      lines.push(it.no + ' ' + it.key + ' [' + it.root + '] ' + (r && r.j ? map[r.j] : '未答'));
    });
    var txt = lines.join('\n');
    var done = function () {
      var b = document.getElementById('copy'), o = b.textContent;
      b.textContent = '已复制';
      setTimeout(function () { b.textContent = o; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done).catch(function () { window.prompt('复制下面这段：', txt); });
    } else {
      window.prompt('复制下面这段：', txt);
    }
  });

  document.querySelectorAll('.stem,.ans').forEach(function (el) {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  });
  paint();
})();
