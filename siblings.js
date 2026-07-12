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
      const numberEl = td.closest('tr').querySelector('td.num');
      const number = numberEl ? numberEl.childNodes[0].textContent.trim() : null;
      const age = td.closest('tr').querySelector('.age')?.textContent.trim();
      const sex = age ? (age.match(/^(牡|牝|せん)/) || [])[1] : null;
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
      if (name && (sire || dam)) horses.push({ name, number, sex, sire, dam, nameEl });
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
      let sex = null;
      for (let i = start; i < next; i++) {
        const first = rows[i].querySelector('td,th');
        const t = first ? first.textContent.trim() : '';
        if (!sex) sex = (t.match(/^(牡|牝|せん)/) || [])[1] || null;
        if (/^（.+）$/.test(t)) {
          const damCell = rows[i - 1] && rows[i - 1].querySelector('td');
          const sireCell = rows[i - 2] && rows[i - 2].querySelector('td');
          const dam = damCell ? damCell.textContent.trim() : null;
          const sire = sireCell ? sireCell.textContent.trim() : null;
          const name = a.textContent.trim();
          const numberEl = a.closest('tr').querySelector('td.horseNum');
          const number = numberEl ? numberEl.textContent.trim() : null;
          if (name && (sire || dam)) horses.push({ name, number, sex, sire, dam, nameEl: a });
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

  // 全員が同父・同母なら、同父グループは全兄弟表示と重複するため省く
  const shown = found.filter(g => g.type !== 'sire' || new Set(g.members.map(m => m.dam)).size > 1);
  shown.sort((a, b) => (a.type === 'dam' ? 0 : 1) - (b.type === 'dam' ? 0 : 1));

  const relationLabel = g => {
    if (g.type === 'sire') return '異母兄弟（' + g.label + '）';
    if (g.full) return '全兄弟（父：' + g.members[0].sire + '／母：' + g.label + '）';
    return '異父兄弟（' + g.label + '）';
  };

  // 馬名にバッジを付ける
  shown.forEach(g => {
    g.members.forEach(h => {
      const b = document.createElement('span');
      b.className = 'kyodai-badge';
      b.textContent = relationLabel(g);
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
    'padding:10px 14px;max-width:380px;max-height:70vh;overflow:auto;' +
    'font-size:13px;line-height:1.6;box-shadow:0 4px 16px rgba(0,0,0,.3);' +
    'font-family:sans-serif;text-align:left;';
  const fullGroups = shown.filter(g => g.type === 'dam' && g.full);
  const maternalHalfGroups = shown.filter(g => g.type === 'dam' && !g.full);
  const paternalHalfGroups = shown.filter(g => g.type === 'sire');
  const groupHtml = g => '<div style="margin:8px 0;border-left:4px solid ' + g.color + ';padding:5px 8px;">' +
    '<b>' + relationLabel(g) + '</b><br>' +
    g.members.map(m => '<div style="margin-top:3px;">' +
      '<b style="font-size:16px;">' + (m.number || '') + '</b> ' + m.name +
      (m.sex ? ' <span style="color:#666;font-size:11px;">' + m.sex + '</span>' : '') + '</div>').join('') + '</div>';
  const sectionHtml = (title, groups) => groups.length
    ? '<div style="margin-top:10px;"><b style="font-size:14px;">' + title + '：' + groups.length + '組</b>' + groups.map(groupHtml).join('') + '</div>' : '';
  let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
    '<strong>兄弟馬あり：' + shown.length + '組</strong>' +
    '<button id="kyodai-close" style="border:none;background:#eee;border-radius:4px;cursor:pointer;padding:2px 8px;">×</button></div>';
  if (!shown.length) {
    html += 'このレースに同父・同母の馬はいません。';
  } else {
    html += sectionHtml('全兄弟', fullGroups);
    html += sectionHtml('異父兄弟（同母）', maternalHalfGroups);
    html += sectionHtml('異母兄弟（同父）', paternalHalfGroups);
  }
  panel.innerHTML = html;
  document.body.appendChild(panel);
  document.getElementById('kyodai-close').onclick = () => {
    panel.remove();
    document.querySelectorAll('.kyodai-badge').forEach(e => e.remove());
  };
})();
