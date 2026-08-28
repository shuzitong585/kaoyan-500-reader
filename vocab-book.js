(function () {
  "use strict";

  const STORAGE_KEY = "kaoyan500_vocab_book";
  const text = value => typeof value === "string" ? value : "";
  const wordKey = value => text(value).trim().toLowerCase();
  const episodeKey = value => /^ep\d{2}$/i.test(text(value)) ? value.toLowerCase() : "";
  let chapters = [];
  let book = [];
  let config;
  let dialog;
  let search;
  let list;
  let status;
  let activeCard;
  let savedOverflow = "";
  let readWarning = "";

  // Stored data is untrusted: tolerate old entries, malformed fields and duplicates.
  function normalizeBook(value) {
    if (!Array.isArray(value)) return [];
    const unique = new Map();
    value.forEach(entry => {
      if (!entry || typeof entry !== "object") return;
      const key = wordKey(entry.word);
      if (!key) return;
      const episode = episodeKey(entry.episode);
      const episodes = [...new Set([episode, ...(Array.isArray(entry.episodes) ? entry.episodes : [])]
        .map(episodeKey).filter(Boolean))];
      if (unique.has(key)) {
        const previous = unique.get(key);
        previous.episodes = [...new Set([...previous.episodes, ...episodes])].sort();
        return;
      }
      unique.set(key, {
        word: text(entry.word).trim(),
        wordId: typeof entry.wordId === "number" ? entry.wordId : text(entry.wordId) || key,
        phonetic: text(entry.phonetic),
        currentMeaning: text(entry.currentMeaning) || text(entry.contextMeaning),
        coreMeaning: text(entry.coreMeaning) || text(entry.core),
        episode: episode || episodes[0] || "",
        episodes,
        context: text(entry.context),
        addedAt: Number.isFinite(entry.addedAt) ? entry.addedAt : 0
      });
    });
    return [...unique.values()];
  }

  function readBook() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      readWarning = Array.isArray(value) ? "" : "旧生词本格式无法识别，已按空列表打开。";
      return normalizeBook(value);
    } catch (_) {
      readWarning = "生词本读取失败。现有记录不会自动覆盖；新增收藏前请确认浏览器允许本地存储。";
      return [];
    }
  }

  function getVocabBook() {
    return book.map(entry => ({ ...entry, episodes: [...entry.episodes] }));
  }

  function showStatus(message) {
    if (!status) return;
    status.textContent = message;
    status.hidden = !message;
  }

  function saveVocabBook(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      book = next;
      readWarning = "";
      showStatus("");
      updateVocabBookButton();
      renderVocabBook();
      return true;
    } catch (_) {
      const message = "保存失败：浏览器本地存储不可用或已满，收藏状态未更改。";
      showStatus(message);
      if (activeCard) activeCard.notice.textContent = message;
      return false;
    }
  }

  function isWordSaved(word) {
    return book.some(entry => wordKey(entry.word) === wordKey(word));
  }

  function episodesFor(word) {
    const key = wordKey(word);
    return [...new Set(chapters.filter(chapter => (chapter.data?.paragraphs || []).some(line =>
      [...text(line).matchAll(/\{\{([A-Za-z]+)\}\}/g)].some(match => wordKey(match[1]) === key)))
      .map(chapter => chapter.id))];
  }

  function addWordToVocabBook(selection) {
    const { word, item, chapter } = selection;
    if (!wordKey(word)) return false;
    const existing = book.find(entry => wordKey(entry.word) === wordKey(word));
    const episodes = [...new Set([...(existing ? existing.episodes : []), chapter.id, ...episodesFor(word)])].sort();
    // Keep the first source/meaning/date when an existing word is saved again.
    if (existing) {
      return saveVocabBook(book.map(entry => entry === existing ? { ...entry, episodes } : entry));
    }
    const paragraph = (chapter.paragraphs || []).find(line =>
      [...line.matchAll(/\{\{([A-Za-z]+)\}\}/g)].some(match => wordKey(match[1]) === wordKey(word)));
    const entry = {
      word,
      wordId: item.wordId ?? item.id ?? wordKey(word),
      phonetic: text(item.phonetic),
      currentMeaning: text(item.context ?? item.contextMeaning),
      coreMeaning: text(item.core ?? item.coreMeaning ?? item.meaning),
      episode: chapter.id,
      episodes,
      context: (paragraph || "").replace(/\{\{([A-Za-z]+)\}\}/g, "$1"),
      addedAt: Date.now()
    };
    return saveVocabBook([...book, entry]);
  }

  function removeWordFromVocabBook(word) {
    return saveVocabBook(book.filter(entry => wordKey(entry.word) !== wordKey(word)));
  }

  function toggleVocabBook(selection) {
    return isWordSaved(selection.word) ? removeWordFromVocabBook(selection.word) : addWordToVocabBook(selection);
  }

  function updateVocabBookButton() {
    if (!activeCard) return;
    const saved = isWordSaved(activeCard.selection.word);
    activeCard.button.textContent = saved ? "★ 已加入生词本" : "☆ 加入生词本";
    activeCard.button.setAttribute("aria-pressed", String(saved));
    activeCard.button.classList.toggle("is-saved", saved);
    activeCard.notice.textContent = "";
  }

  function element(tag, className, content) {
    const node = document.createElement(tag);
    node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function attachCard(card, selection) {
    const footer = element("div", "vocab-save-footer");
    const button = element("button", "vocab-save-button");
    button.type = "button";
    const notice = element("p", "vocab-save-notice");
    notice.setAttribute("role", "status");
    footer.append(button, notice);
    const title = card.querySelector(".word-title");
    if (title) title.after(footer);
    else card.prepend(footer);
    activeCard = { selection, button, notice };
    button.addEventListener("click", () => toggleVocabBook(selection));
    updateVocabBookButton();
  }

  function renderVocabBook() {
    if (!list) return;
    document.getElementById("vocab-book-count").textContent = "已收藏 " + book.length + " 词";
    document.getElementById("vocab-book-entry-count").textContent = "☆ 生词 " + book.length;
    list.replaceChildren();
    const query = search.value.trim().toLowerCase();
    const found = book.filter(entry => [entry.word, entry.currentMeaning, entry.coreMeaning]
      .some(value => value.toLowerCase().includes(query))).sort((a, b) => b.addedAt - a.addedAt);
    if (!found.length) {
      const empty = element("div", "vocab-book-empty");
      empty.append(element("h3", "", book.length ? "没有找到匹配的单词" : "还没有收藏单词"));
      empty.append(element("p", "", book.length ? "试试其他英文或中文释义。" :
        "在剧情里遇到想记住的词，点一下就收进这里。"));
      list.append(empty);
      return;
    }
    found.forEach(entry => {
      const row = element("section", "vocab-book-item");
      const heading = element("div", "vocab-book-word");
      heading.append(element("h3", "", entry.word), element("span", "phonetic", entry.phonetic || "音标暂缺"));
      row.append(heading);
      row.append(element("p", "vocab-book-core", entry.coreMeaning || entry.currentMeaning || "暂无释义记录"));
      const episodes = episodesFor(entry.word).sort();
      const firstSource = chapters.find(chapter => chapter.id === entry.episode);
      row.append(element("p", "vocab-book-source", "首次来源：" + (entry.episode.toUpperCase() || "暂无记录") +
        (firstSource?.data?.title ? " · " + firstSource.data.title : "")));
      row.append(element("p", "vocab-book-occurrences", episodes.length ? "出现于 " + episodes.length + " 个章节" : "出现章节暂无法核实"));
      const actions = element("div", "vocab-book-actions");
      const go = element("button", "", "查看原剧情");
      go.type = "button";
      const source = chapters.find(chapter => chapter.id === entry.episode && chapter.status === "available" &&
        Object.keys(chapter.data?.words || {}).some(word => wordKey(word) === wordKey(entry.word))) ||
        chapters.find(chapter => chapter.status === "available" && episodes.includes(chapter.id) &&
          Object.keys(chapter.data?.words || {}).some(word => wordKey(word) === wordKey(entry.word)));
      go.disabled = !source;
      if (!source) go.title = "原章节暂无可用记录";
      go.addEventListener("click", () => {
        if (!source) return;
        closeVocabBook();
        config.onNavigate(source.id, entry.word);
      });
      const remove = element("button", "vocab-book-remove", "取消收藏");
      remove.type = "button";
      remove.setAttribute("aria-label", "取消收藏 " + entry.word);
      remove.addEventListener("click", () => {
        if (removeWordFromVocabBook(entry.word)) {
          showStatus("已取消收藏 " + entry.word);
          search.focus({ preventScroll: true });
        }
      });
      actions.append(go, remove);
      row.append(actions);
      list.append(row);
    });
  }

  function openVocabBook() {
    config.beforeOpen();
    book = readBook();
    updateVocabBookButton();
    search.value = "";
    renderVocabBook();
    showStatus(readWarning);
    savedOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    search.focus();
  }

  function closeVocabBook() {
    dialog.close();
    document.body.style.overflow = savedOverflow;
  }

  function init(options) {
    config = options;
    chapters = options.chapters;
    dialog = document.getElementById("vocab-book-dialog");
    search = document.getElementById("vocab-book-search");
    list = document.getElementById("vocab-book-list");
    status = document.getElementById("vocab-book-status");
    book = readBook();
    document.getElementById("vocab-book-open").addEventListener("click", openVocabBook);
    document.getElementById("vocab-book-close").addEventListener("click", closeVocabBook);
    dialog.addEventListener("cancel", event => {
      event.preventDefault();
      closeVocabBook();
    });
    dialog.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeVocabBook();
      }
    });
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeVocabBook();
    });
    search.addEventListener("input", renderVocabBook);
    window.addEventListener("storage", event => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      book = readBook();
      updateVocabBookButton();
      renderVocabBook();
      showStatus(readWarning);
    });
    renderVocabBook();
  }

  window.VocabBook = {
    init, attachCard, getVocabBook, saveVocabBook, isWordSaved,
    addWordToVocabBook, removeWordFromVocabBook, toggleVocabBook,
    renderVocabBook, updateVocabBookButton, episodesFor,
    navigateToStory: (episode, word) => config.onNavigate(episode, word)
  };
})();
