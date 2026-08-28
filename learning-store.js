(function () {
  "use strict";
  // The only owner of learned/daily/recent state. Favorites remain independent.
  window.createLearningStore = function ({ chapters, storage = localStorage, now = () => new Date() }) {
    const keys = { learned: "kaoyan500_learned_words", daily: "kaoyan500_daily_learning", recent: "kaoyan500_recent_learning" };
    const normalize = value => typeof value === "string" ? value.trim().toLowerCase() : "";
    const catalog = new Map();
    const locations = new Map();
    const positions = new Map();
    const listeners = new Set();
    let warning = "";
    let learned = new Set();
    let daily;
    let recent = null;

    chapters.forEach(chapter => {
      const words = new Set(Object.keys(chapter.data?.words || {}).map(normalize));
      catalog.set(chapter.id, words);
      const counts = new Map();
      (chapter.data?.paragraphs || []).forEach((paragraph, paragraphIndex) => {
        for (const match of paragraph.matchAll(/\{\{([A-Za-z]+)\}\}/g)) {
          const word = normalize(match[1]);
          if (!words.has(word)) continue;
          const occurrenceIndex = (counts.get(word) || 0) + 1;
          counts.set(word, occurrenceIndex);
          const occurrenceId = `${chapter.id.toUpperCase()}_${word}_${occurrenceIndex}`;
          const location = { chapterId: chapter.id, word: match[1], occurrenceId, occurrenceIndex, paragraphIndex };
          locations.set(occurrenceId, location);
          positions.set(`${chapter.id}:${paragraphIndex}:${match.index}`, location);
        }
      });
    });
    const allWords = new Set([...catalog.values()].flatMap(words => [...words]));
    const array = value => Array.isArray(value) ? value : [];
    const dateKey = () => {
      const date = now();
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };
    const emptyDaily = () => ({ date: dateKey(), contacts: [], newWords: [], reviewContacts: [] });
    function read(key, fallback) {
      try {
        const raw = storage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (_) { warning = "部分学习记录无法读取；原记录未自动删除。"; return fallback; }
    }
    function write(key, value) {
      try { storage.setItem(key, JSON.stringify(value)); }
      catch (_) { warning = "学习记录暂未保存，仅当前页面有效。请检查浏览器存储空间或权限。"; }
    }
    function getLearnedWords() {
      try {
        const raw = storage.getItem(keys.learned);
        return array(raw === null ? [] : JSON.parse(raw)).map(normalize).filter(word => allWords.has(word));
      } catch (_) {
        warning = "全局学习记录暂时无法读取；保留当前页面记录。";
        return [...learned];
      }
    }
    function parseDaily(value) {
      if (!value || value.date !== dateKey()) return emptyDaily();
      // Contacts are clicks, not unique positions. Retain repeated occurrence IDs.
      const contacts = array(value.contacts).filter(id => locations.has(id));
      const newWords = [...new Set(array(value.newWords).map(normalize).filter(word => allWords.has(word) &&
        contacts.some(id => normalize(locations.get(id).word) === word)))];
      const firstNewContacts = new Set(newWords);
      const reviewContacts = contacts.filter(id => {
        const word = normalize(locations.get(id).word);
        if (firstNewContacts.delete(word)) return false;
        return true;
      });
      return { date: value.date, contacts, newWords, reviewContacts };
    }
    function parseRecent(value) {
      if (!value) return null;
      const chapterId = normalize(value.chapterId || value.ep || value.episode);
      const word = normalize(value.word);
      let location = locations.get(value.occurrenceId);
      if (!location || location.chapterId !== chapterId || normalize(location.word) !== word) {
        location = [...locations.values()].find(item => item.chapterId === chapterId && normalize(item.word) === word);
      }
      if (!location) return null;
      return { ...location, updatedAt: Number.isFinite(value.updatedAt) ? value.updatedAt : 0 };
    }
    function hydrate() {
      const saved = read(keys.learned, null);
      learned = new Set(array(saved).map(normalize).filter(word => allWords.has(word)));
      // Migrate legacy records once; an explicit empty global set stays empty.
      const migrationKey = "kaoyan500_learned_words_migrated";
      if (saved === null && !read(migrationKey, false)) {
        chapters.forEach(chapter => array(read(`${chapter.id}:viewedWords`, [])).forEach(word => {
          if (catalog.get(chapter.id).has(normalize(word))) learned.add(normalize(word));
        }));
        write(keys.learned, [...learned]);
      }
      write(migrationKey, true);
      daily = parseDaily(read(keys.daily, null));
      recent = parseRecent(read(keys.recent, null));
    }
    function rollover() {
      // Read before resetting so a tab waking after midnight cannot erase
      // contacts already recorded today in another tab.
      const saved = read(keys.daily, daily);
      if (saved?.date === dateKey()) daily = parseDaily(saved);
      if (daily.date === dateKey()) return false;
      daily = emptyDaily();
      write(keys.daily, daily);
      return true;
    }
    function snapshot(chapterId) {
      rollover();
      learned = new Set(getLearnedWords());
      daily = parseDaily(read(keys.daily, daily));
      recent = parseRecent(read(keys.recent, recent));
      const chapterWords = catalog.get(chapterId) || new Set();
      return {
        learnedCount: learned.size,
        percent: learned.size / 500 * 100,
        chapterTotal: chapterWords.size,
        chapterUnlocked: [...chapterWords].filter(word => learned.has(word)).length,
        daily: { ...daily, contacts: [...daily.contacts], newWords: [...daily.newWords], reviewContacts: [...daily.reviewContacts] },
        recent: recent ? { ...recent } : null,
        warning
      };
    }
    function notify() { listeners.forEach(listener => listener()); }
    function recordContact(occurrenceId) {
      const location = locations.get(occurrenceId);
      if (!location) return false;
      // Read the authoritative global set, including an explicit reset to [].
      learned = new Set(getLearnedWords());
      rollover();
      daily = parseDaily(read(keys.daily, daily));
      const word = normalize(location.word);
      const isNew = !learned.has(word);
      learned.add(word);
      daily.contacts.push(occurrenceId);
      if (isNew) daily.newWords.push(word);
      else daily.reviewContacts.push(occurrenceId);
      // Every deliberate successful lookup counts, including repeated clicks.
      recent = { ...location, updatedAt: now().getTime() };
      warning = "";
      write(keys.learned, [...learned]);
      write(keys.daily, daily);
      write(keys.recent, recent);
      notify();
      return true;
    }
    hydrate();
    return {
      keys, snapshot, recordContact,
      getOccurrenceAt: (chapterId, paragraphIndex, offset) => positions.get(`${chapterId}:${paragraphIndex}:${offset}`),
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      refresh() { hydrate(); notify(); },
      checkDate() { if (rollover()) notify(); }
    };
  };
})();
