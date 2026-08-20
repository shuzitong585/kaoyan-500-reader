(function () {
  "use strict";

  const chapters = window.CHAPTERS;
  let data = chapters.find(chapter => chapter.status === "available").data;
  const title = document.getElementById("story-title");
  const story = document.getElementById("story");
  const card = document.getElementById("word-card");
  const count = document.getElementById("word-count");
  const viewedCount = document.getElementById("viewed-count");
  const chapterLabel = document.getElementById("chapter-label");
  const chapterNav = document.getElementById("chapter-nav");
  const dictionary = document.getElementById("dictionary-panel");
  const mobileCardBackdrop = document.getElementById("mobile-card-backdrop");
  const mobileCardClose = document.getElementById("mobile-card-close");
  let storageKey = "";
  let wordKeys = [];
  let viewedWords = new Set();
  let lastMobileTrigger = null;

  function isMobileView() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function openMobileCard(trigger) {
    const currentDictionary = document.querySelector(".dictionary");
    if (!currentDictionary) return;
    lastMobileTrigger = trigger || null;
    mobileCardBackdrop.hidden = false;
    currentDictionary.classList.add("mobile-open");
    mobileCardBackdrop.classList.add("mobile-open");
    document.body.classList.add("mobile-card-open");
    currentDictionary.setAttribute("aria-hidden", "false");
    mobileCardClose.focus({ preventScroll: true });
  }

  function closeMobileCard(restoreFocus = true) {
    const currentDictionary = document.querySelector(".dictionary");
    if (currentDictionary) {
      currentDictionary.classList.remove("mobile-open");
      currentDictionary.removeAttribute("aria-hidden");
    }
    mobileCardBackdrop.classList.remove("mobile-open");
    document.body.classList.remove("mobile-card-open");
    mobileCardBackdrop.hidden = true;
    if (restoreFocus && lastMobileTrigger && isMobileView()) {
      lastMobileTrigger.focus({ preventScroll: true });
    }
    lastMobileTrigger = null;
  }

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function renderParagraph(text) {
    const pattern = /\{\{([A-Za-z]+)\}\}/g;
    let html = "";
    let cursor = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      html += escapeHtml(text.slice(cursor, match.index));
      const word = match[1];
      html += `<button class="vocab" type="button" data-word="${escapeHtml(word)}">${escapeHtml(word)}</button>`;
      cursor = pattern.lastIndex;
    }
    html += escapeHtml(text.slice(cursor));
    return `<p>${html}</p>`;
  }

  function listSection(label, items) {
    if (!items || items.length === 0) return "";
    return `<section class="card-section"><h3 class="section-label">${label}</h3><ul class="compact-list">${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
  }

  function textSection(label, body, className = "") {
    if (!body) return "";
    return `<section class="card-section"><h3 class="section-label">${label}</h3><p class="section-body ${className}">${escapeHtml(body)}</p></section>`;
  }

  function updateViewedCount() {
    viewedCount.textContent = `已查看 ${viewedWords.size} / ${wordKeys.length}`;
  }

  function loadViewedWords() {
    storageKey = `${data.id}:viewedWords`;
    wordKeys = Object.keys(data.words);
    viewedWords = new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      viewedWords = new Set(saved.filter(word => wordKeys.includes(word)));
    } catch (error) {
      console.warn("学习进度读取失败，将从本章开始记录。", error);
    }
  }

  function markAsViewed(word) {
    if (viewedWords.has(word)) return;
    viewedWords.add(word);
    updateViewedCount();
    try {
      localStorage.setItem(storageKey, JSON.stringify([...viewedWords]));
    } catch (error) {
      console.warn("学习进度保存失败。", error);
    }
  }

  function selectWord(word, trackView = false) {
    const item = data.words[word];
    if (!item) return;
    if (trackView) markAsViewed(word);
    document.querySelectorAll(".vocab").forEach(button => {
      const selected = button.dataset.word === word;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    const rootLabel = item.wordFormation ? "词根词缀｜拆开记" : "记忆技巧｜这样记";
    card.innerHTML = `
      <div class="word-title">
        <p class="word-kicker">当前单词</p>
        <div class="word-heading-row">
          <h2>${escapeHtml(word)}</h2>
          <span class="phonetic">${escapeHtml(item.phonetic)}</span>
          <span class="pos">${escapeHtml(item.pos)}</span>
        </div>
      </div>
      <section class="meaning-now">
        <h3 class="section-label">本文义</h3>
        <p>${escapeHtml(item.context)}</p>
      </section>
      ${textSection("核心词义", item.core, "core-meaning")}
      ${listSection("一词多义", item.meanings)}
      ${textSection(rootLabel, item.wordFormation || item.mnemonic)}
      ${listSection("词族联想", item.relatedWords)}
      ${listSection("高频搭配", item.collocations)}
      ${textSection("剧情记忆", item.storyHook, "memory")}
    `;
  }

  function renderChapterNav() {
    chapterNav.innerHTML = chapters.map(chapter => {
      const disabled = chapter.status !== "available";
      const text = disabled ? `${chapter.label} · 制作中` : chapter.label;
      return `<button class="chapter-tab" type="button" data-chapter="${chapter.id}" ${disabled ? "disabled" : ""} aria-label="${text}">${text}</button>`;
    }).join("");
  }

  function loadChapter(chapterId) {
    const chapter = chapters.find(item => item.id === chapterId && item.status === "available");
    if (!chapter || !chapter.data) return;
    closeMobileCard(false);
    data = chapter.data;
    loadViewedWords();
    title.textContent = data.title;
    chapterLabel.textContent = `考研 500 高频词 · ${chapter.label}`;
    story.innerHTML = data.paragraphs.map(renderParagraph).join("");
    count.textContent = `${wordKeys.length} 个目标词`;
    updateViewedCount();
    chapterNav.querySelectorAll(".chapter-tab").forEach(button => {
      const active = button.dataset.chapter === chapter.id;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    selectWord(data.defaultWord, false);
    document.querySelector(".dictionary").scrollTop = 0;
  }

  renderChapterNav();
  chapterNav.addEventListener("click", event => {
    const button = event.target.closest(".chapter-tab:not(:disabled)");
    if (button) loadChapter(button.dataset.chapter);
  });
  story.addEventListener("click", event => {
    const button = event.target.closest(".vocab");
    if (button) {
      selectWord(button.dataset.word, true);
      if (isMobileView()) {
        openMobileCard(button);
      }
    }
  });
  mobileCardBackdrop.addEventListener("click", () => closeMobileCard());
  mobileCardClose.addEventListener("click", () => closeMobileCard());
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && dictionary.classList.contains("mobile-open")) {
      closeMobileCard();
    }
  });
  window.addEventListener("resize", () => {
    if (!isMobileView() && dictionary.classList.contains("mobile-open")) {
      closeMobileCard(false);
    }
  });
  loadChapter(data.id);
})();
