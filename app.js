/* ============ Shir — learn Hebrew through song ============ */
'use strict';

/* ---------- storage ---------- */
const DB = {
  get(k, d){ try{ const v = localStorage.getItem('shir.'+k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ localStorage.setItem('shir.'+k, JSON.stringify(v)); }
};
let packs    = DB.get('packs', []);      // song packs
let vocab    = DB.get('vocab', []);      // {id,he,tr,en,category,note,song}
let srs      = DB.get('srs', {});        // vocabId -> {box:1-5, due:ts}
let settings = DB.get('settings', {fontScale:1});
const save = () => { DB.set('packs',packs); DB.set('vocab',vocab); DB.set('srs',srs); DB.set('settings',settings); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const esc = s => String(s??'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- toast ---------- */
let toastT;
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ---------- demo pack (traditional, public-domain song) ---------- */
function seedDemo(){
  if (DB.get('seeded', false)) return;
  const p = {
    id: uid(), title: 'Hevenu Shalom Aleichem', artist: 'Traditional',
    spotifyUrl: '', youtubeUrl: '', addedAt: Date.now(),
    lines: [
      {section: 'Chorus'},
      {he:'הבאנו שלום עליכם', tr:'hevenu shalom aleichem', en:'We brought peace upon you'},
      {he:'הבאנו שלום עליכם', tr:'hevenu shalom aleichem', en:'We brought peace upon you'},
      {he:'הבאנו שלום עליכם', tr:'hevenu shalom aleichem', en:'We brought peace upon you'},
      {he:'הבאנו שלום, שלום, שלום עליכם', tr:'hevenu shalom, shalom, shalom aleichem', en:'We brought peace, peace, peace upon you'}
    ],
    lessons: [
      {title:'The one root doing all the work', body:'הבאנו (hevenu) means "we brought." The root is ב-ו-א (to come); in the hif\u2019il binyan it becomes "to bring" — causing something to come. The ־נו (-nu) ending marks "we" in past tense. You will hear that -nu ending constantly in Israeli songs: ahavnu (we loved), halachnu (we went).'},
      {title:'Aleichem = al + chem', body:'עליכם (aleichem) is the preposition על (al, "on/upon") fused with ־כם (-chem, "you," plural). Hebrew loves gluing pronouns onto prepositions: alai (on me), alecha (on you, m.), aleinu (on us). Learn this pattern once and dozens of song lines unlock.'},
      {title:'Singing tip', body:'The ch in aleichem is the throaty chet/chaf sound, like clearing your throat softly — not "ch" as in "cheese." Shalom stresses the second syllable: sha-LOM.'}
    ],
    vocab: [
      {he:'שלום', tr:'shalom', en:'peace; hello', category:'Greetings & blessings', note:'From the root ש-ל-ם, wholeness.'},
      {he:'הבאנו', tr:'hevenu', en:'we brought', category:'Verbs', note:'Hif\u2019il past, root ב-ו-א. The -nu ending = "we."'},
      {he:'עליכם', tr:'aleichem', en:'upon you (pl.)', category:'Little words & prefixes', note:'al (on) + -chem (you pl.)'}
    ]
  };
  importPack(p, true);
  DB.set('seeded', true);
}

/* ---------- pack import ---------- */
function importPack(p, silent){
  if (!p || !Array.isArray(p.lines) || !p.title) throw new Error('bad pack');
  p.id = p.id || uid(); p.addedAt = p.addedAt || Date.now();
  p.lessons = p.lessons || []; p.vocab = p.vocab || [];
  packs = packs.filter(x => x.id !== p.id);
  packs.unshift(p);
  let added = 0;
  for (const w of p.vocab){
    if (!w.he) continue;
    const dup = vocab.find(v => v.he === w.he && (v.en||'').toLowerCase() === (w.en||'').toLowerCase());
    if (dup) continue;
    const id = uid();
    vocab.push({id, he:w.he, tr:w.tr||'', en:w.en||'', category:w.category||'Uncategorized', note:w.note||'', song:p.title});
    srs[id] = {box:1, due:Date.now()};
    added++;
  }
  save();
  if (!silent) toast(`Saved "${p.title}" — ${added} new words added to your repository`);
  return added;
}

/* ---------- prompt generator (the one online step) ---------- */
function buildPrompt(title, artist, lyrics, extras){
  return `You are helping me learn Hebrew through Israeli songs. I am pasting lyrics I have for personal study. Turn them into a study pack.

Song: ${title || 'Unknown'}
Artist: ${artist || 'Unknown'}

LYRICS I HAVE:
${lyrics}
${extras ? '\nADDITIONAL MATERIAL I HAVE (existing transliteration/translation to use or improve):\n' + extras : ''}

Respond with ONLY a JSON object, no markdown fences, no commentary, in exactly this schema:
{
  "title": "...",
  "artist": "...",
  "lines": [
    {"section": "Verse 1"},
    {"he": "Hebrew line", "tr": "precise transliteration matching how it is sung", "en": "natural English"}
  ],
  "lessons": [
    {"title": "short lesson title", "body": "2-6 sentences. Cover across the lessons: (1) key vocabulary in the context of these lines, (2) one or two grammar patterns actually present in the song (binyanim, prefixes like ve-/she-/ha-/be-, pronoun suffixes, tenses), (3) cultural or idiomatic context, (4) pronunciation tips for singing along (chet/resh, stress placement). Reference the actual lyric lines. 4-6 lessons total."}
  ],
  "vocab": [
    {"he": "word or short phrase", "tr": "transliteration", "en": "meaning", "category": "one of: Love & relationships | Faith & spirit | Feelings | Body & senses | Nature & world | Time | Places & movement | People & family | Verbs | Little words & prefixes | Slang & everyday | Greetings & blessings | Music & celebration", "note": "one helpful sentence: root, pattern, or usage"}
  ]
}
Rules: keep every Hebrew line as I gave it; use {"section": "..."} markers between verses/chorus; transliteration should match the sung pronunciation; pick 10-20 of the most useful vocab items; valid JSON only.`;
}

/* ---------- navigation ---------- */
const TABS = [
  {id:'songs', ic:'\u266A', label:'Songs'},
  {id:'study', ic:'\u{1D11E}', label:'Study'},
  {id:'words', ic:'\u05D0', label:'Words'},
  {id:'cards', ic:'\u25A4', label:'Cards'},
  {id:'add',   ic:'+', label:'Add'}
];
let tab = 'songs';
let currentPackId = DB.get('lastPack', null);
let studyMode = 'sing';       // 'sing' | 'lesson'
let layerHe = true, layerTr = true, layerEn = true;
let wordFilter = '', catFilter = null, detailWordId = null;
let deck = [], deckIdx = 0, flipped = false, deckCat = null;
let singIdx = 0;

function go(t){ tab = t; render(); window.scrollTo(0,0); }
function currentPack(){ return packs.find(p => p.id === currentPackId) || packs[0]; }

function renderTabs(){
  document.getElementById('tabbar').innerHTML = TABS.map(t =>
    `<button class="${tab===t.id?'on':''}" onclick="go('${t.id}')"><span class="ic">${t.ic}</span>${t.label}</button>`
  ).join('');
}

function render(){
  renderTabs();
  const m = document.getElementById('main');
  const ctx = document.getElementById('ctx');
  ctx.textContent = navigator.onLine ? '' : 'offline — study away';
  if (tab === 'songs') m.innerHTML = vSongs();
  else if (tab === 'study') m.innerHTML = vStudy();
  else if (tab === 'words') m.innerHTML = vWords();
  else if (tab === 'cards') m.innerHTML = vCards();
  else if (tab === 'add') m.innerHTML = vAdd();
}

/* ---------- Songs ---------- */
function vSongs(){
  if (!packs.length) return `<h2 class="screen">Your songs</h2>
    <div class="empty"><span class="big">\u266A</span>No songs yet.<br>Head to <b>Add</b> to build your first pack —<br>Omer Adam and Ishay Ribo are waiting.</div>`;
  return `<h2 class="screen">Your songs</h2>
    <p class="sub">${packs.length} pack${packs.length>1?'s':''} stored on this phone \u00B7 ${vocab.length} words in your repository</p>
    ${packs.map(p => `
      <div class="card" style="padding:12px 14px">
        <button class="songrow" onclick="openPack('${p.id}')">
          <span class="disc">\u266A</span>
          <span class="meta">
            <span class="t">${esc(p.title)}</span><br>
            <span class="a">${esc(p.artist||'')}</span>
          </span>
          <span class="n">${p.lines.filter(l=>l.he).length} lines</span>
        </button>
        <div class="row" style="margin-top:10px">
          ${p.spotifyUrl?`<button class="btn ghost small" onclick="window.open('${esc(p.spotifyUrl)}')">\u25B6 Spotify</button>`:''}
          ${p.youtubeUrl?`<button class="btn ghost small" onclick="window.open('${esc(p.youtubeUrl)}')">\u25B6 YouTube</button>`:''}
          <button class="btn danger small" onclick="delPack('${p.id}')">Delete</button>
        </div>
      </div>`).join('')}`;
}
function openPack(id){ currentPackId = id; DB.set('lastPack', id); singIdx = 0; go('study'); }
function delPack(id){
  const p = packs.find(x=>x.id===id);
  if (!confirm(`Delete "${p.title}"? Its words stay in your repository.`)) return;
  packs = packs.filter(x=>x.id!==id); save(); render();
}

/* ---------- Study ---------- */
function vStudy(){
  const p = currentPack();
  if (!p) return `<div class="empty" style="margin-top:30px"><span class="big">\u{1D11E}</span>Pick a song first from the <b>Songs</b> tab.</div>`;
  const head = `<div class="studyhead"><div class="t">${esc(p.title)}</div><div class="a">${esc(p.artist||'')}</div></div>
    <div class="modeswitch">
      <button class="${studyMode==='sing'?'on':''}" onclick="studyMode='sing';render()">Sing along</button>
      <button class="${studyMode==='lesson'?'on':''}" onclick="studyMode='lesson';render()">Lessons</button>
    </div>`;
  if (studyMode === 'lesson'){
    const L = p.lessons||[];
    return head + (L.length ? L.map((l,i)=>`
      <div class="card lesson"><h3>${i+1}. ${esc(l.title)}</h3><p>${esc(l.body)}</p></div>`).join('')
      : `<div class="empty">No lessons in this pack.</div>`)
      + `<div class="divider-dots">\u25CF \u25CF \u25CF</div>
         <button class="btn ghost" onclick="deckCat=null;startDeckForSong('${p.id}')">Practice this song's words \u2192</button>`;
  }
  const hiddenCls = `${layerHe?'':'hidden-he '}${layerTr?'':'hidden-tr '}${layerEn?'':'hidden-en'}`;
  return head + `
    <div class="layers">
      <button class="chip ${layerHe?'on':''}" onclick="layerHe=!layerHe;render()">עברית</button>
      <button class="chip ${layerTr?'on':''}" onclick="layerTr=!layerTr;render()">translit</button>
      <button class="chip ${layerEn?'on':''}" onclick="layerEn=!layerEn;render()">English</button>
      <span class="fontctl">
        <button onclick="fscale(-0.08)">A\u2212</button><button onclick="fscale(0.08)">A+</button>
      </span>
    </div>
    <button class="btn" style="margin-bottom:14px" onclick="openSing()">\u{1D11E} &nbsp;Sing mode ${p.spotifyUrl||p.youtubeUrl?'(open your music first)':''}</button>
    <div style="font-size:${settings.fontScale}em">
    ${p.lines.map(l => l.section
      ? `<div class="lyric section">${esc(l.section)}</div>`
      : `<div class="lyric ${hiddenCls}">
           <div class="he">${esc(l.he)}</div>
           <div class="tr">${esc(l.tr)}</div>
           <div class="en">${esc(l.en)}</div>
         </div>`).join('')}
    </div>`;
}
function fscale(d){ settings.fontScale = Math.min(1.6, Math.max(0.8, +(settings.fontScale+d).toFixed(2))); save(); render(); }

/* ---------- Sing mode ---------- */
function singLines(){ return currentPack().lines; }
function openSing(){
  const p = currentPack(); if (!p) return;
  if (singIdx >= p.lines.length) singIdx = 0;
  if (p.lines[singIdx] && p.lines[singIdx].section) singIdx++;
  document.getElementById('singmode').classList.add('on');
  renderSing();
}
function closeSing(){ document.getElementById('singmode').classList.remove('on'); }
function singStep(d){
  const L = singLines(); let i = singIdx + d;
  while (i >= 0 && i < L.length && L[i].section) i += d;
  if (i < 0 || i >= L.length) return;
  singIdx = i; renderSing();
}
function renderSing(){
  const L = singLines(); const l = L[singIdx]; if (!l) return closeSing();
  let sect = '';
  for (let i = singIdx; i >= 0; i--){ if (L[i].section){ sect = L[i].section; break; } }
  let nxt = null;
  for (let i = singIdx+1; i < L.length; i++){ if (!L[i].section){ nxt = L[i]; break; } }
  const total = L.filter(x=>!x.section).length;
  const pos = L.slice(0, singIdx+1).filter(x=>!x.section).length;
  document.getElementById('singmode').innerHTML = `
    <div class="top"><button onclick="closeSing()" style="color:var(--dim);font-size:14px">\u2715 close</button><span>${pos} / ${total}</span></div>
    <div class="stage" onclick="singStep(1)">
      ${sect?`<div class="sect">${esc(sect)}</div>`:''}
      <div class="cur">
        ${layerHe?`<div class="he">${esc(l.he)}</div>`:''}
        ${layerTr?`<div class="tr">${esc(l.tr)}</div>`:''}
        ${layerEn?`<div class="en">${esc(l.en)}</div>`:''}
      </div>
      ${nxt?`<div class="next">${layerHe?`<div class="he">${esc(nxt.he)}</div>`:`<div>${esc(nxt.tr)}</div>`}</div>`:''}
    </div>
    <div class="navz">
      <button onclick="singStep(-1)">\u2190 back</button>
      <button class="primary" onclick="singStep(1)">next line \u2192</button>
    </div>`;
}

/* ---------- Words ---------- */
function catList(){
  const c = {};
  for (const w of vocab){ const k = w.category||'Uncategorized'; (c[k]=c[k]||[]).push(w); }
  return Object.entries(c).sort((a,b)=>b[1].length-a[1].length);
}
function vWords(){
  if (detailWordId){
    const w = vocab.find(x=>x.id===detailWordId);
    if (w) return `
      <button class="btn ghost small" onclick="detailWordId=null;render()">\u2190 all words</button>
      <div class="card wdetail" style="margin-top:14px;padding:26px 18px">
        <div class="he">${esc(w.he)}</div>
        <div class="tr">${esc(w.tr)}</div>
        <div class="en">${esc(w.en)}</div>
        ${w.note?`<div class="note">${esc(w.note)}</div>`:''}
        <div class="src">${esc(w.category)}${w.song?` \u00B7 from \u201C${esc(w.song)}\u201D`:''}</div>
      </div>
      <button class="btn ghost" onclick="detailWordId=null;deckCat='${esc(w.category)}';startDeck()">Practice \u201C${esc(w.category)}\u201D cards</button>
      <div style="height:10px"></div>
      <button class="btn danger" onclick="delWord('${w.id}')">Remove word</button>`;
    detailWordId = null;
  }
  if (!vocab.length) return `<h2 class="screen">Word repository</h2>
    <div class="empty"><span class="big">\u05D0</span>Empty for now. Every song pack you add<br>pours its vocabulary in here, organized by theme.</div>`;
  const q = wordFilter.trim().toLowerCase();
  const cats = catList().map(([cat, ws]) => {
    let list = ws;
    if (q) list = ws.filter(w => (w.he+w.tr+w.en+w.note).toLowerCase().includes(q));
    if (catFilter && catFilter !== cat) return '';
    if (!list.length) return '';
    return `<div class="cathead"><h3>${esc(cat)}</h3><span class="ct">${list.length}</span></div>` +
      list.map(w => `<button class="word" onclick="detailWordId='${w.id}';render()">
        <span class="he">${esc(w.he)}</span><span class="tr">${esc(w.tr)}</span><span class="en">${esc(w.en)}</span>
      </button>`).join('');
  }).join('');
  return `<h2 class="screen">Word repository</h2>
    <p class="sub">${vocab.length} words \u00B7 keeps growing with every song</p>
    <div class="wsearch"><input class="f" placeholder="Search Hebrew, transliteration, or English\u2026" value="${esc(wordFilter)}" oninput="wordFilter=this.value;render();this.focus();this.setSelectionRange(this.value.length,this.value.length)"></div>
    <div>${catList().map(([c,ws])=>`<button class="chip ${catFilter===c?'on':''}" onclick="catFilter=catFilter==='${esc(c)}'?null:'${esc(c)}';render()">${esc(c)} \u00B7 ${ws.length}</button>`).join('')}</div>
    ${cats || '<div class="empty">No matches.</div>'}`;
}
function delWord(id){ vocab = vocab.filter(w=>w.id!==id); delete srs[id]; detailWordId=null; save(); render(); }

/* ---------- Flashcards (Leitner SRS) ---------- */
const BOX_DAYS = {1:0, 2:1, 3:3, 4:7, 5:21};
function dueWords(cat){
  const now = Date.now();
  return vocab.filter(w => (!cat || w.category===cat) && (srs[w.id]?.due ?? 0) <= now);
}
function startDeck(){
  deck = dueWords(deckCat); deckIdx = 0; flipped = false;
  if (!deck.length){ toast(deckCat ? `No cards due in "${deckCat}" right now` : 'No cards due — come back later'); return; }
  deck.sort(()=>Math.random()-0.5);
  go('cards');
}
function startDeckForSong(pid){
  const p = packs.find(x=>x.id===pid); if(!p) return;
  const titles = new Set([p.title]);
  deckCat = null;
  deck = vocab.filter(w => titles.has(w.song)); deckIdx=0; flipped=false;
  if (!deck.length){ toast('This song has no vocab yet'); return; }
  deck.sort(()=>Math.random()-0.5);
  go('cards');
}
function grade(g){
  const w = deck[deckIdx]; const s = srs[w.id] || {box:1, due:0};
  if (g === 'again') s.box = 1;
  else if (g === 'good') s.box = Math.min(5, s.box+1);
  else s.box = Math.min(5, s.box+2);
  s.due = Date.now() + BOX_DAYS[s.box]*86400000 + (s.box===1? 5*60000 : 0);
  srs[w.id] = s; save();
  flipped = false; deckIdx++;
  render();
}
function vCards(){
  const due = dueWords(null).length;
  const known = Object.values(srs).filter(s=>s.box>=4).length;
  const head = `<h2 class="screen">Flashcards</h2>
    <div class="fcstats"><span><b>${due}</b> due</span><span><b>${vocab.length}</b> total</span><span><b>${known}</b> nearly known</span></div>`;
  if (!vocab.length) return head + `<div class="empty"><span class="big">\u25A4</span>Add a song first — its words become your cards.</div>`;
  if (!deck.length || deckIdx >= deck.length){
    if (deck.length && deckIdx >= deck.length){
      const done = `<div class="card" style="text-align:center;padding:26px"><div style="font-size:30px">\u2728</div>
        <p style="margin-top:8px">Session done — ${deck.length} cards reviewed.<br><span style="color:var(--dim);font-size:13px">Spacing does the remembering for you.</span></p></div>`;
      deck = [];
      return head + done + deckPickers();
    }
    return head + deckPickers();
  }
  const w = deck[deckIdx];
  return head + `
    <p class="sub" style="text-align:center;margin-bottom:10px">${deckIdx+1} of ${deck.length}${deckCat?` \u00B7 ${esc(deckCat)}`:''}</p>
    <div class="fc" onclick="flipped=!flipped;render()">
      <span class="cat">${esc(w.category)}</span>
      <div class="he">${esc(w.he)}</div>
      ${flipped?`<div class="tr">${esc(w.tr)}</div><div class="en">${esc(w.en)}</div>${w.note?`<div style="color:var(--dim);font-size:13px;margin-top:12px;line-height:1.5">${esc(w.note)}</div>`:''}`:''}
      <span class="tap">${flipped?'':'tap to reveal'}</span>
    </div>
    ${flipped?`<div class="grade">
      <button class="again" onclick="grade('again')">Again</button>
      <button class="good" onclick="grade('good')">Good</button>
      <button class="easy" onclick="grade('easy')">Easy</button>
    </div>`:'<div style="height:57px"></div>'}
    <div style="height:12px"></div>
    <button class="btn ghost small" onclick="deck=[];render()">End session</button>`;
}
function deckPickers(){
  return `<button class="btn" onclick="deckCat=null;startDeck()">Review everything due (${dueWords(null).length})</button>
    <div class="divider-dots">\u25CF \u25CF \u25CF</div>
    <p class="sub" style="margin-bottom:8px">Or drill one category:</p>
    <div>${catList().map(([c])=>{
      const n = dueWords(c).length;
      return `<button class="chip ${n?'on':''}" onclick="deckCat='${esc(c)}';startDeck()">${esc(c)}${n?` \u00B7 ${n} due`:''}</button>`;
    }).join('')}</div>`;
}

/* ---------- Add / generate ---------- */
function vAdd(){
  const online = navigator.onLine;
  return `<h2 class="screen">Add a song</h2>
  <p class="sub">Generation needs internet once; the finished pack lives on your phone and studies fully offline.</p>

  <div class="card step">
    <h3><span class="stepnum">1</span>Song details</h3>
    <label class="f">Title</label><input class="f" id="g-title" placeholder="e.g. Shnei Meshugaim">
    <label class="f">Artist</label><input class="f" id="g-artist" placeholder="e.g. Omer Adam">
    <label class="f">Spotify link (optional — for the play button)</label><input class="f" id="g-spot" placeholder="https://open.spotify.com/track/\u2026">
    <label class="f">YouTube link (optional)</label><input class="f" id="g-yt" placeholder="https://youtu.be/\u2026">
  </div>

  <div class="card step">
    <h3><span class="stepnum">2</span>Paste the lyrics you have</h3>
    <label class="f">Hebrew lyrics</label>
    <textarea class="f he" id="g-lyrics" placeholder="\u05D4\u05D3\u05D1\u05E7 \u05DB\u05D0\u05DF \u05D0\u05EA \u05DE\u05D9\u05DC\u05D5\u05EA \u05D4\u05E9\u05D9\u05E8\u2026"></textarea>
    <label class="f">Already have transliteration / English from a site? Paste it too (optional)</label>
    <textarea class="f" id="g-extras" placeholder="Optional — the AI will align and polish it"></textarea>
    <p class="hint">Spotify/YouTube links don't carry lyrics, so grab them from any lyrics site or video description and paste here.</p>
  </div>

  <div class="card step">
    <h3><span class="stepnum">3</span>Generate the study pack
      <span class="online-pill ${online?'':'offline-pill'}">${online?'\u25CF online now':'\u25CB needs internet'}</span></h3>
    <p class="hint" style="margin:0 0 12px">This copies a ready-made prompt. Open the Claude app (or claude.ai), paste it, and Claude returns the pack as JSON — transliteration, translation, lessons, and categorized vocab.</p>
    <button class="btn" onclick="copyPrompt()">Copy lesson prompt \u2192 open Claude</button>
  </div>

  <div class="card step">
    <h3><span class="stepnum">4</span>Paste the JSON pack back</h3>
    <textarea class="f" id="g-json" placeholder='{"title": \u2026}'></textarea>
    <div style="height:10px"></div>
    <button class="btn" onclick="doImport()">Save pack to my phone</button>
    <p class="hint">From here on this song works with zero internet — sing-along, lessons, words, cards.</p>
  </div>

  <div class="divider-dots">\u25CF \u25CF \u25CF</div>
  <div class="card step">
    <h3>Quick add a single word</h3>
    <div class="row">
      <input class="f he" id="w-he" placeholder="\u05E2\u05D1\u05E8\u05D9\u05EA" style="direction:rtl">
      <input class="f" id="w-tr" placeholder="translit">
    </div>
    <div style="height:8px"></div>
    <div class="row">
      <input class="f" id="w-en" placeholder="English">
      <input class="f" id="w-cat" placeholder="category" list="cats">
    </div>
    <datalist id="cats">${catList().map(([c])=>`<option value="${esc(c)}">`).join('')}</datalist>
    <div style="height:10px"></div>
    <button class="btn ghost" onclick="quickWord()">Add to repository</button>
  </div>`;
}
function copyPrompt(){
  const t = document.getElementById('g-title').value.trim();
  const a = document.getElementById('g-artist').value.trim();
  const ly = document.getElementById('g-lyrics').value.trim();
  const ex = document.getElementById('g-extras').value.trim();
  if (!ly){ toast('Paste the Hebrew lyrics first'); return; }
  sessionStorage.setItem('shir.pending', JSON.stringify({t,a,
    s:document.getElementById('g-spot').value.trim(), y:document.getElementById('g-yt').value.trim()}));
  const prompt = buildPrompt(t, a, ly, ex);
  const done = () => toast('Prompt copied — paste it into Claude, then bring the JSON back to step 4');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(prompt).then(done, ()=>fallbackCopy(prompt, done));
  else fallbackCopy(prompt, done);
}
function fallbackCopy(text, done){
  const ta = document.createElement('textarea'); ta.value = text;
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); done(); }catch(e){ toast('Copy failed — select and copy manually'); }
  document.body.removeChild(ta);
}
function doImport(){
  let raw = document.getElementById('g-json').value.trim();
  if (!raw){ toast('Paste the JSON from Claude first'); return; }
  raw = raw.replace(/^```(json)?/i,'').replace(/```$/,'').trim();
  try{
    const p = JSON.parse(raw);
    const pend = JSON.parse(sessionStorage.getItem('shir.pending')||'{}');
    p.title = p.title || pend.t; p.artist = p.artist || pend.a;
    p.spotifyUrl = pend.s || ''; p.youtubeUrl = pend.y || '';
    importPack(p);
    currentPackId = p.id; DB.set('lastPack', p.id); singIdx = 0;
    go('study');
  }catch(e){ toast('That JSON didn\u2019t parse — copy Claude\u2019s full reply and try again'); }
}
function quickWord(){
  const he = document.getElementById('w-he').value.trim();
  if (!he){ toast('Hebrew word needed'); return; }
  const id = uid();
  vocab.push({id, he, tr:document.getElementById('w-tr').value.trim(),
    en:document.getElementById('w-en').value.trim(),
    category:document.getElementById('w-cat').value.trim()||'Uncategorized', note:'', song:''});
  srs[id] = {box:1, due:Date.now()};
  save(); toast('Word added'); render();
}

/* ---------- boot ---------- */
window.addEventListener('online', render);
window.addEventListener('offline', render);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
seedDemo();
render();
