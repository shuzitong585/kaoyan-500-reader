(function () {
  "use strict";
  const rows = window.FOCUS_WORDS;
  const KEY = "kaoyan500_focus_reviews";
  let episode = "EP01", mode = "learn", filter = "all", revealed = new Set();
  const labels = { unknown: "○ 不会", fuzzy: "△ 模糊", known: "✓ 掌握" };
  const id = row => `${row.episode}:${row.word.toLowerCase()}`;
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  function node(tag, cls, text) {
    const el = document.createElement(tag); el.className = cls || "";
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function button(text, action, cls = "") {
    const b = node("button", cls, text); b.type = "button"; b.addEventListener("click", action); return b;
  }
  const nav = node("nav", "study-navigation"); nav.setAttribute("aria-label", "学习导航");
  const readerButton = button("剧情阅读", () => show(false));
  const focusButton = button("重点词卡", () => show(true));
  const bookButton = button("生词本", () => document.getElementById("vocab-book-open").click());
  nav.append(readerButton, focusButton, bookButton);
  document.body.prepend(nav);
  const panel = node("section", "focus-panel"); panel.hidden = true; panel.setAttribute("aria-label", "重点词卡");
  const heading = node("h1", "", "重点词卡"); heading.tabIndex = -1;
  panel.append(node("p", "focus-kicker", "考研英语500核心词"), heading);
  const eps = node("nav", "focus-episodes"); eps.setAttribute("aria-label", "重点词章节");
  [...new Set(rows.map(row => row.episode))].forEach(ep => {
    const b = button(ep, () => { episode = ep; revealed.clear(); render(); }); b.dataset.episode = ep; eps.append(b);
  });
  const title = node("h2", "focus-count");
  const chapterHeader = node("div", "focus-chapter-header");
  const chapterIntro = node("div", "focus-chapter-intro");
  chapterIntro.append(title, node("p", "focus-chapter-caption", "结合剧情语境，只记这一章真正值得深学的词"));
  const toolbar = node("div", "focus-toolbar");
  const learnButton = button("学习模式", () => { mode = "learn"; render(); });
  const testButton = button("自测模式", () => { mode = "test"; revealed.clear(); render(); });
  const select = node("select"); select.setAttribute("aria-label", "重点词筛选");
  for (const [value, text] of Object.entries({ all: "全部", unknown: "不会", fuzzy: "模糊", known: "已掌握", due: "今日待复习" })) {
    const option = node("option", "", text); option.value = value; select.append(option);
  }
  select.addEventListener("change", () => { filter = select.value; render(); });
  toolbar.append(learnButton, testButton, select);
  const note = node("p", "focus-note", "真题语境 / 考法为母表中的考法概括，不是历年真题原句。今日待复习列出当前不会或模糊的词。");
  const notice = node("p", "focus-notice"); notice.setAttribute("role", "status");
  const list = node("div", "focus-list");
  chapterHeader.append(chapterIntro, toolbar);
  panel.append(eps, chapterHeader, note, notice, list);
  document.querySelector("main").after(panel);
  function show(open) {
    document.body.classList.toggle("focus-active", open); panel.hidden = !open;
    readerButton.setAttribute("aria-current", open ? "false" : "page");
    focusButton.setAttribute("aria-current", open ? "page" : "false");
    if (open) { render(); heading.focus(); }
  }
  function source(row) {
    const chapter = window.CHAPTERS.find(ch => ch.id === row.episode.toLowerCase()).data;
    const word = Object.keys(chapter.words).find(w => w.toLowerCase() === row.word.toLowerCase());
    return { chapter, word, item: chapter.words[word] };
  }
  function mark(row, status) {
    try {
      // Refuse to overwrite malformed history. Each answer appends an event.
      const raw = localStorage.getItem(KEY);
      const records = raw === null ? {} : JSON.parse(raw);
      if (!records || typeof records !== "object" || Array.isArray(records)) throw Error("Invalid history");
      const previous = records[id(row)] || {};
      const now = Date.now();
      const event = { status, round: "round1", reviewedAt: now };
      const history = [...(Array.isArray(previous.history) ? previous.history : []), event];
      records[id(row)] = { ...previous, word: row.word, episode: row.episode, status, currentStatus: status,
        reviewCount: (Number.isFinite(previous.reviewCount) ? previous.reviewCount : 0) + 1,
        lastReviewedAt: now, round: "round1", history,
        rounds: { ...(previous.rounds || {}), round1: { status, lastReviewedAt: now },
          round2: previous.rounds?.round2 || null, round3: previous.rounds?.round3 || null } };
      localStorage.setItem(KEY, JSON.stringify(records)); notice.textContent = `${row.word}：已记录${labels[status]}`; render();
    } catch (_) { notice.textContent = "自测记录保存失败；未覆盖原有记录，请检查浏览器存储。"; }
  }
  function syncSaves() {
    list.querySelectorAll("[data-save-word]").forEach(b => {
      const saved = window.VocabBook.isWordSaved(b.dataset.saveWord);
      b.textContent = saved ? "★ 已加入生词本" : "☆ 加入生词本"; b.setAttribute("aria-pressed", String(saved));
    });
  }
  function section(label, text) {
    if (!text) return null;
    const s = node("section", "focus-detail");
    const themes = { "真题先记": ["exam", "✎"], "易错提醒": ["warning", "▣"], "高频搭配": ["collocation", "◎"], "同义替换": ["synonym", "S"], "真题语境 / 考法": ["context", "▤"], "一句记忆": ["memory", "💡"] };
    const [theme, symbol] = themes[label]; s.classList.add(`focus-detail-${theme}`);
    const h = node("h3", ""); const icon = node("span", "focus-module-icon", symbol); icon.setAttribute("aria-hidden", "true");
    h.append(icon, document.createTextNode(label)); s.append(h, node("p", "", text)); return s;
  }
  function render() {
    const records = read(); const chapterRows = rows.filter(row => row.episode === episode);
    title.replaceChildren(node("span", "focus-ep-label", episode.replace("EP", "EP ")), node("span", "focus-chapter-label", "本章重点词"), node("strong", "focus-core-count", `${chapterRows.length} 个核心词`));
    eps.querySelectorAll("button").forEach(b => b.setAttribute("aria-current", b.dataset.episode === episode ? "page" : "false"));
    learnButton.setAttribute("aria-pressed", String(mode === "learn")); testButton.setAttribute("aria-pressed", String(mode === "test"));
    const shown = chapterRows.filter(row => {
      const status = records[id(row)]?.currentStatus;
      return filter === "all" || (filter === "due" ? ["unknown", "fuzzy"].includes(status) : status === filter);
    });
    list.replaceChildren();
    if (!shown.length) list.append(node("p", "focus-empty", "本章暂无符合筛选条件的重点词。"));
    for (const row of shown) {
      const selection = source(row); const answer = mode === "learn" || revealed.has(id(row));
      const card = node("article", "focus-card"); card.setAttribute("aria-label", row.word);
      card.classList.toggle("focus-card-question", !answer);
      const info = node("div", "focus-word-info");
      info.append(node("span", "focus-number", String(row.order).padStart(2, "0")), node("h2", "", row.word));
      const phonetic = row.phonetic || selection.item?.phonetic;
      if (phonetic) info.append(node("p", "focus-phonetic", phonetic));
      if (row.pos || selection.item?.pos) info.append(node("p", "focus-pos", row.pos || selection.item.pos));
      if (answer && row.meaning) info.append(node("p", "focus-meaning", row.meaning));
      const details = node("div", "focus-details");
      if (answer) {
        for (const [label, value] of [["真题先记",row.examFirst],["易错提醒",row.warning],["高频搭配",row.collocations],["同义替换",row.synonyms],["真题语境 / 考法",row.examContext],["一句记忆",row.memoryTip]]) {
          const block = section(label,value); if(block) details.append(block);
        }
      } else details.append(node("p", "focus-question", "先想一想：\n它的核心中文义是什么？"), button("显示答案", () => { revealed.add(id(row)); render(); }, "focus-reveal"));
      const actions = node("div", "focus-actions");
      if (answer && mode === "test") {
        const statuses = node("div", "focus-ratings"); statuses.setAttribute("aria-label", "第一轮自测状态");
        for(const [status,label] of Object.entries(labels)) {
          const b = button(label,()=>mark(row,status), `focus-rating-${status}`); b.setAttribute("aria-pressed",String(records[id(row)]?.currentStatus===status)); statuses.append(b);
        }
        actions.append(statuses);
      }
      if (answer) {
        const save = button("",()=> { if(!window.VocabBook.toggleVocabBook(selection)) notice.textContent="收藏保存失败，请检查浏览器存储。"; syncSaves(); });
        save.dataset.saveWord=row.word;
        const auxiliary = node("div", "focus-auxiliary");
        auxiliary.append(button("← 回到剧情",()=> { show(false); window.VocabBook.navigateToStory(row.episode.toLowerCase(), row.word); }),save);
        actions.append(auxiliary);
      }
      card.append(info,details,actions); list.append(card);
    }
    syncSaves();
  }
  new MutationObserver(syncSaves).observe(document.getElementById("vocab-book-entry-count"),{childList:true,subtree:true,characterData:true});
  window.addEventListener("storage",e=>{if(e.key===KEY&&!panel.hidden)render();});
  window.addEventListener("reader:navigate",()=>show(false));
  show(false);
})();
