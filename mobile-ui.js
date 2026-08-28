(function () {
  "use strict";
  // UI adapters only. Reuse existing controls, state, and persistence.
  const media = window.matchMedia("(max-width: 768px)");
  const nav = document.querySelector(".study-navigation");
  const dialog = document.getElementById("vocab-book-dialog");
  const closeBook = document.getElementById("vocab-book-close");
  const focusPanel = document.querySelector(".focus-panel");
  const navButtons = [...nav.querySelectorAll("button")];
  const header = document.createElement("header");
  header.className = "mobile-reader-header";
  const brand = document.createElement("strong");
  brand.textContent = "考研英语500核心词";
  const pageLabel = document.createElement("span");
  header.append(brand, pageLabel);
  nav.after(header);
  ["剧情", "重点词", "生词本"].forEach((label, i) => {
    const desktop = document.createElement("span");
    desktop.className = "desktop-nav-label";
    desktop.textContent = navButtons[i].textContent;
    const mobile = document.createElement("span");
    mobile.className = "mobile-nav-label";
    mobile.textContent = label;
    navButtons[i].replaceChildren(desktop, mobile);
  });
  function chapterPicker(source, label) {
    const control = document.createElement("nav");
    control.className = "mobile-chapter-picker";
    control.setAttribute("aria-label", label);
    const previous = document.createElement("button");
    const next = document.createElement("button");
    previous.type = next.type = "button";
    previous.textContent = "← 上一章";
    next.textContent = "下一章 →";
    const select = document.createElement("select");
    select.setAttribute("aria-label", label + "选择");
    control.append(previous, select, next);
    source.after(control);
    const buttons = () => [...source.querySelectorAll("button")];
    function sync() {
      const list = buttons();
      if (select.options.length !== list.length) {
        select.replaceChildren(...list.map((b, i) => {
          const option = document.createElement("option");
          option.value = String(i); option.textContent = b.textContent;
          return option;
        }));
      }
      const current = list.findIndex(b => b.getAttribute("aria-current") === "page");
      list.forEach((b, i) => { select.options[i].disabled = b.disabled; });
      select.value = String(current);
      previous.disabled = current <= 0 || list[current - 1]?.disabled;
      next.disabled = current < 0 || current >= list.length - 1 || list[current + 1]?.disabled;
    }
    function choose(index) {
      const target = buttons()[index];
      if (!target || target.disabled) return;
      target.click(); sync();
      if (media.matches) window.scrollTo({ top: 0, behavior: "auto" });
    }
    select.addEventListener("change", () => choose(Number(select.value)));
    previous.addEventListener("click", () => choose(Number(select.value) - 1));
    next.addEventListener("click", () => choose(Number(select.value) + 1));
    new MutationObserver(sync).observe(source, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-current", "disabled"] });
    sync();
    return source;
  }
  const readerChapters = chapterPicker(document.getElementById("chapter-nav"), "剧情章节");
  const focusChapters = chapterPicker(document.querySelector(".focus-episodes"), "重点词章节");
  function syncPage() {
    const isBook = dialog.open;
    const isFocus = !focusPanel.hidden;
    const active = isBook ? 2 : isFocus ? 1 : 0;
    navButtons.forEach((b, i) => b.classList.toggle("mobile-nav-active", i === active));
    const current = (isFocus ? focusChapters : readerChapters).querySelector('[aria-current="page"]');
    pageLabel.textContent = isBook ? "生词本" : `${isFocus ? "重点词" : "剧情"} · ${current?.textContent || ""}`;
    // The same navigation stays usable in the native dialog's top layer.
    if (media.matches && isBook) {
      if (nav.parentElement !== dialog) dialog.append(nav);
    } else if (nav.parentElement !== document.body) header.before(nav);
  }
  nav.addEventListener("click", event => {
    const b = event.target.closest("button");
    if (!b || !media.matches) return;
    if (dialog.open) {
      if (b === navButtons[2]) { event.stopImmediatePropagation(); return; }
      closeBook.click();
    }
    if (document.querySelector(".dictionary.mobile-open")) document.getElementById("mobile-card-close").click();
  }, true);
  new MutationObserver(syncPage).observe(dialog, { attributes: true, attributeFilter: ["open"] });
  new MutationObserver(syncPage).observe(focusPanel, { attributes: true, attributeFilter: ["hidden"] });
  for (const source of [readerChapters, focusChapters]) {
    new MutationObserver(syncPage).observe(source, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });
  }
  media.addEventListener("change", syncPage);
  syncPage();
})();
