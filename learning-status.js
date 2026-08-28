(function () {
  "use strict";
  let store;
  let currentChapterId = "";
  function render() {
    const state = store.snapshot(currentChapterId);
    const contacts = state.daily.contacts.length;
    document.getElementById("learning-percent").textContent = `${contacts}%`;
    const progress = document.getElementById("learning-progress");
    progress.value = Math.min(contacts, 100);
    progress.setAttribute("aria-valuetext", `今日接触 ${contacts} 次，目标 100 次`);
    document.getElementById("learning-recent").textContent = state.recent ? `最近学习 ${state.recent.chapterId.toUpperCase()}` : "最近学习 --";
    document.getElementById("learning-continue").disabled = !state.recent;
    document.getElementById("word-count").textContent = `${state.chapterTotal} 个目标词`;
    document.getElementById("viewed-count").textContent = `本章已解锁 ${state.chapterUnlocked} / ${state.chapterTotal}`;
    document.getElementById("daily-contacts").textContent = `今日接触 ${state.daily.contacts.length} / 100`;
    document.getElementById("daily-new").textContent = `新词 ${state.daily.newWords.length}`;
    document.getElementById("daily-review").textContent = `复习 ${state.daily.reviewContacts.length}`;
    const notice = document.getElementById("learning-notice");
    notice.textContent = state.warning;
    notice.hidden = !state.warning;
  }
  function attachCard(card, word) {
    const episodes = window.VocabBook.episodesFor(word).sort();
    if (!episodes.length) return;
    const section = document.createElement("section");
    section.className = "story-recurrence";
    const label = document.createElement("h3");
    label.className = "section-label";
    label.textContent = "剧情重复记忆";
    const description = document.createElement("p");
    description.textContent = episodes.length === 1 ? "目前在 1 个章节中出现" : `该词已在 ${episodes.length} 个章节中出现`;
    const source = document.createElement("span");
    source.textContent = `首次出现：${episodes[0].toUpperCase()}`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "查看首次剧情 ›";
    button.addEventListener("click", () => window.VocabBook.navigateToStory(episodes[0], word));
    section.append(label, description, source, button);
    card.append(section);
  }
  function init(learningStore, navigate) {
    store = learningStore;
    store.subscribe(render);
    document.getElementById("learning-continue").addEventListener("click", () => {
      const recent = store.snapshot(currentChapterId).recent;
      if (recent) navigate(recent.chapterId, recent.word, recent.occurrenceId);
    });
    window.addEventListener("storage", event => {
      if (event.key === null || Object.values(store.keys).includes(event.key) || /:viewedWords$/.test(event.key)) store.refresh();
    });
    window.addEventListener("focus", () => store.checkDate());
    document.addEventListener("visibilitychange", () => { if (!document.hidden) store.checkDate(); });
    window.setInterval(() => store.checkDate(), 1000);
    render();
  }
  window.LearningStatus = { init, attachCard, renderLearningStatus: render, setChapter(chapterId) { currentChapterId = chapterId; render(); } };
})();
