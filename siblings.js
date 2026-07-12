/*
 * 出馬表 兄弟チェッカー（中央・地方対応）
 * 対応ページ:
 *   - JRA公式 出馬表   www.jra.go.jp/JRADB/accessD.html
 *   - 地方競馬情報サイト 出馬表  www.keiba.go.jp/KeibaWeb/TodayRaceInfo/DebaTable
 * 同レース内の 全兄弟 / 異父兄弟（同母） / 異母兄弟（同父） を検出して
 * バッジ表示＋一覧パネルを出す。再実行で消える（トグル）。
 */
(() => {
  // 再実行時は前回の表示を消す（トグル動作）
  const old = document.getElementById('kyodai-panel');
  document.querySelectorAll('.kyodai-badge').forEach(e => e.remove());
  if (old) { old.remove(); return; }

  const horses = [];

  // --- JRA公式: td.horse 内の ul.family_line に父・母 ---
  const parseJRA = () => {
    document.querySelectorAll('td.horse').forEach(td => {
      const nameEl = td.querySelector('.name a, .name');
      const name = nameEl ? nameEl.textContent.trim() : null;
      const sireEl = td.querySelector('.family_line .sire');
      const sire = sireEl ? sireEl.textContent.replace(/^父：/, '').trim() : null;
      const mareLi = td.querySelector('.family_line .mare');
      let dam = null;
      if (mareLi) {
        const c = mareLi.cloneNode(true);
        const bm = c.querySelector('.bloodmare');
        if (bm) bm.remove();
        dam = c.textContent.replace(/^母：/, '').trim();
      }
      if (name && (sire || dam)) horses.push({ name, sire, dam, nameEl });
    });
  };

  // --- 地方競馬情報サイト: a.horseName のブロック内、
  //     「（母父名）」形式の行を目印に、その1つ上が母・2つ上が父 ---
  const parseNAR = () => {
    const anchors = [...document.querySelectorAll('a.horseName')];
    anchors.forEach((a, ai) => {
      const tbl = a.closest('table');
      if (!tbl) return;
      const rows = [...tbl.querySelectorAll('tr')];
      const start = rows.indexOf(a.closest('tr'));
      const next = anchors[ai + 1] && anchors[ai + 1].closest('table') === tbl
        ? rows.indexOf(anchors[ai + 1].closest('tr')) : rows.length;
      for (let i = start; i < next; i++) {
        const first = rows[i].querySelector('td,th');
        const t = first ? first.textContent.trim() : '';
        if (/^（.+）$/.test(t)) {
          const damCell = rows[i - 1] && rows[i - 1].querySelector('td');
          const sireCell = rows[i - 2] && rows[i - 2].querySelector('td');
          const dam = damCell ? damCell.textContent.trim() : null;
          const sire = sireCell ? sireCell.textContent.trim() : null;
          const name = a.textContent.trim();
          if (name && (sire || dam)) horses.push({ name, sire, dam, nameEl: a });
          break;
        }
      }
    });
  };

  if (location.hostname.includes('keiba.go.jp')) parseNAR();
  else parseJRA();

  if (!horses.length) {
    alert('出馬表の馬情報が見つかりませんでした。\nJRA公式または地方競馬情報サイトの出馬表ページで実行してください。');
    return;
  }

  // 父・母それぞれでグループ化
  const byKey = {};
  const add = (key, type, label, h) => {
    (byKey[key] || (byKey[key] = { type, label, members: [] })).members.push(h);
  };
  horses.forEach(h => {
    if (h.sire) add('S:' + h.sire, 'sire', h.sire, h);
    if (h.dam) add('D:' + h.dam, 'dam', h.dam, h);
  });

  const colors = ['#e91e63', '#2196f3', '#4caf50', '#ff9800', '#9c27b0',
                  '#00bcd4', '#795548', '#607d8b', '#f44336', '#3f51b5'];
  let ci = 0;
  const found = [];
  Object.values(byKey).forEach(g => {
    if (g.members.length < 2) return;
    g.color = colors[ci++ % colors.length];
    // 同母グループ内で父も同じなら全兄弟
    if (g.type === 'dam') {
      const sires = new Set(g.members.map(m => m.sire));
      g.full = sires.size === 1;
    }
    found.push(g);
  });

  // 同母グループを先に（希少で重要なので）
  found.sort((a, b) => (a.type === 'dam' ? 0 : 1) - (b.type === 'dam' ? 0 : 1));

  // 馬名にバッジを付ける
  found.forEach(g => {
    g.members.forEach(h => {
      const b = document.createElement('span');
      b.className = 'kyodai-badge';
      b.textContent = (g.type === 'dam' ? '母' : '父') + ':' + g.label;
      b.style.cssText = 'display:inline-block;margin-left:6px;padding:1px 6px;' +
        'border-radius:9px;font-size:11px;font-weight:bold;color:#fff;' +
        'vertical-align:middle;background:' + g.color + ';';
      h.nameEl.appendChild(b);
    });
  });

  // 一覧パネル
  const panel = document.createElement('div');
  panel.id = 'kyodai-panel';
  panel.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;' +
    'background:#fff;color:#222;border:2px solid #333;border-radius:8px;' +
    'padding:10px 14px;max-width:340px;max-height:70vh;overflow:auto;' +
    'font-size:13px;line-height:1.6;box-shadow:0 4px 16px rgba(0,0,0,.3);' +
    'font-family:sans-serif;text-align:left;';
  let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
    '<strong>兄弟チェック（' + horses.length + '頭）</strong>' +
    '<button id="kyodai-close" style="border:none;background:#eee;border-radius:4px;cursor:pointer;padding:2px 8px;">×</button></div>';
  if (!found.length) {
    html += 'このレースに同父・同母の馬はいません。';
  } else {
    found.forEach(g => {
      const typeLabel = g.type === 'dam'
        ? (g.full ? '全兄弟' : '同母（兄弟／異父兄弟）')
        : '同父（異母兄弟）';
      html += '<div style="margin-bottom:8px;border-left:4px solid ' + g.color + ';padding-left:8px;">' +
        '<b>' + (g.type === 'dam' ? '母' : '父') + '：' + g.label + '</b><br>' +
        '<span style="color:#666;font-size:11px;">' + typeLabel + '</span><br>' +
        g.members.map(m => m.name).join('、') + '</div>';
    });
  }
  panel.innerHTML = html;
  document.body.appendChild(panel);
  document.getElementById('kyodai-close').onclick = () => {
    panel.remove();
    document.querySelectorAll('.kyodai-badge').forEach(e => e.remove());
  };
})();
