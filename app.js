(function () {
  "use strict";

  const chapters = window.CHAPTERS;
  const learningStore = window.createLearningStore({ chapters });
  let currentChapter = chapters.find(chapter => chapter.status === "available");
  let data = currentChapter.data;
  const title = document.getElementById("story-title");
  const story = document.getElementById("story");
  const card = document.getElementById("word-card");
  const chapterLabel = document.getElementById("chapter-label");
  const chapterNav = document.getElementById("chapter-nav");
  const dictionary = document.getElementById("dictionary-panel");
  const mobileCardBackdrop = document.getElementById("mobile-card-backdrop");
  const mobileCardClose = document.getElementById("mobile-card-close");
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
    currentDictionary.style.visibility = "visible";
    currentDictionary.style.transform = "translateY(0)";
    mobileCardBackdrop.classList.add("mobile-open");
    mobileCardBackdrop.style.visibility = "visible";
    mobileCardBackdrop.style.opacity = "1";
    document.body.classList.add("mobile-card-open");
    document.body.style.overflow = "hidden";
    currentDictionary.setAttribute("aria-hidden", "false");
    mobileCardClose.focus({ preventScroll: true });
  }

  function closeMobileCard(restoreFocus = true) {
    const currentDictionary = document.querySelector(".dictionary");
    if (currentDictionary) {
      currentDictionary.classList.remove("mobile-open");
      currentDictionary.style.visibility = "";
      currentDictionary.style.transform = "";
      currentDictionary.removeAttribute("aria-hidden");
    }
    mobileCardBackdrop.classList.remove("mobile-open");
    mobileCardBackdrop.style.visibility = "";
    mobileCardBackdrop.style.opacity = "";
    document.body.classList.remove("mobile-card-open");
    document.body.style.overflow = "";
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

  function renderParagraph(text, paragraphIndex) {
    const pattern = /\{\{([A-Za-z]+)\}\}/g;
    let html = "";
    let cursor = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      html += escapeHtml(text.slice(cursor, match.index));
      const word = match[1];
      const location = learningStore.getOccurrenceAt(currentChapter.id, paragraphIndex, match.index);
      html += `<button class="vocab" type="button" data-word="${escapeHtml(word)}" data-chapter="${escapeHtml(currentChapter.id)}" data-occurrence="${location?.occurrenceIndex || 0}" data-occurrence-id="${escapeHtml(location?.occurrenceId || "")}">${escapeHtml(word)}</button>`;
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

  function flexibleSection(label, content, className = "") {
    if (Array.isArray(content)) return listSection(label, content);
    return textSection(label, content, className);
  }

  function exampleSection(example) {
    if (!example) return "";
    if (typeof example === "string") return textSection("例句", example, "example-text");
    if (!example.en || !example.zh) return "";
    return `<section class="card-section example-section">
      <h3 class="section-label">例句</h3>
      <p class="section-body example-en">${escapeHtml(example.en)}</p>
      <p class="example-zh">${escapeHtml(example.zh)}</p>
    </section>`;
  }

  function selectWord(word) {
    const item = data.words[word];
    if (!item) return;
    document.querySelectorAll(".vocab").forEach(button => {
      const selected = button.dataset.word === word;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    const contextMeaning = item.context ?? item.contextMeaning;
    const coreMeaning = item.core ?? item.meaning;
    const mnemonic = item.mnemonic || item.memoryTip;
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
        <p>${escapeHtml(contextMeaning)}</p>
      </section>
      ${textSection("核心词义", coreMeaning, "core-meaning")}
      ${listSection("一词多义", item.meanings)}
      ${listSection("高频搭配", item.collocations)}
      ${flexibleSection("易混辨析", item.confusables)}
      ${flexibleSection("考研用法", item.examUsage)}
      ${textSection("构词 / 拆词助记", item.wordFormation)}
      ${listSection("词族联想", item.relatedWords)}
      ${flexibleSection("易错点", item.errorPoint)}
      ${exampleSection(item.example)}
      ${textSection("记忆技巧｜这样记", mnemonic)}
      ${textSection("剧情记忆", item.storyHook, "memory")}
    `;
    window.VocabBook.attachCard(card, { word, item, chapter: data });
    window.LearningStatus.attachCard(card, word);
    return true;
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
    currentChapter = chapter;
    data = currentChapter.data;
    title.textContent = data.title;
    chapterLabel.textContent = `考研 500 高频词 · ${chapter.label}`;
    story.innerHTML = data.paragraphs.map(renderParagraph).join("");
    if (window.EP01Listening) window.EP01Listening.setChapter(currentChapter.id);
    window.LearningStatus.setChapter(currentChapter.id);
    chapterNav.querySelectorAll(".chapter-tab").forEach(button => {
      const active = button.dataset.chapter === chapter.id;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
    selectWord(data.defaultWord);
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
      // Programmatic selection never records learning. Only real story clicks do.
      if (selectWord(button.dataset.word) && learningStore.recordContact(button.dataset.occurrenceId)) {
        // Refresh this document synchronously after saving; storage events only
        // notify other documents. Reuse the existing renderer and state source.
        window.LearningStatus.renderLearningStatus();
      }
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
  function navigateToStory(episode, word, occurrenceId) {
      const chapter = chapters.find(entry => entry.id === episode && entry.status === "available");
      if (!chapter) return false;
      const key = Object.keys(chapter.data.words).find(entry => entry.toLowerCase() === word.toLowerCase());
      if (!key) return false;
      window.dispatchEvent(new Event("reader:navigate"));
      loadChapter(episode);
      selectWord(key);
      const targets = [...story.querySelectorAll(".vocab")];
      const target = targets.find(button => button.dataset.occurrenceId === occurrenceId) || targets.find(button => button.dataset.word === key);
      if (target) {
        target.scrollIntoView({ block: "center", behavior: "auto" });
        target.focus({ preventScroll: true });
        target.classList.add("vocab-return-highlight");
        window.setTimeout(() => target.classList.remove("vocab-return-highlight"), 1500);
      }
      return true;
  }
  window.VocabBook.init({
    chapters,
    beforeOpen: () => closeMobileCard(false),
    onNavigate: navigateToStory
  });
  window.LearningStatus.init(learningStore, navigateToStory);
  loadChapter(data.id);
})();
