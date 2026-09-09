(function () {
  "use strict";

  const story = document.getElementById("story");
  const meta = document.querySelector(".reader-meta");
  const synth = window.speechSynthesis;
  let chapterId = "ep01";
  let state = "idle";
  let paragraphIndex = 0;
  let session = 0;

  const controls = document.createElement("section");
  controls.className = "listening-controls";
  controls.setAttribute("aria-label", "EP01 剧情听读");
  controls.innerHTML = `
    <strong class="listening-label">🎧 听本章</strong>
    <button type="button" data-listen="play">▶ 播放</button>
    <button type="button" data-listen="pause" disabled>⏸ 暂停</button>
    <button type="button" data-listen="resume" disabled>▶ 继续</button>
    <button type="button" data-listen="stop" disabled>■ 停止</button>
    <p class="listening-status" role="status" aria-live="polite">准备播放 EP01 剧情</p>`;
  meta.insertAdjacentElement("afterend", controls);

  const buttons = Object.fromEntries([...controls.querySelectorAll("button")].map(button => [button.dataset.listen, button]));
  const status = controls.querySelector(".listening-status");

  function paragraphs() {
    return [...story.querySelectorAll("p")];
  }

  function clearHighlight() {
    paragraphs().forEach(paragraph => paragraph.classList.remove("listening-active"));
  }

  function update(nextState, message) {
    state = nextState;
    buttons.play.disabled = nextState === "playing" || nextState === "paused";
    buttons.pause.disabled = nextState !== "playing";
    buttons.resume.disabled = nextState !== "paused";
    buttons.stop.disabled = nextState === "idle";
    status.textContent = message;
  }

  function narrationVoice() {
    const voices = synth.getVoices();
    const natural = /Natural|Neural|Online|Premium|Enhanced|自然/i;
    return voices.find(voice => /^zh(-|_)(CN|TW|HK)/i.test(voice.lang) && natural.test(voice.name))
      || voices.find(voice => /^zh(-|_)/i.test(voice.lang))
      || null;
  }

  function stop(message = "已停止") {
    session += 1;
    if (synth) synth.cancel();
    paragraphIndex = 0;
    clearHighlight();
    update("idle", message);
  }

  function speakNext(activeSession) {
    if (activeSession !== session || state !== "playing") return;
    const items = paragraphs();
    if (paragraphIndex >= items.length) {
      stop("本章播放完成");
      return;
    }
    clearHighlight();
    const paragraph = items[paragraphIndex];
    paragraph.classList.add("listening-active");
    const utterance = new SpeechSynthesisUtterance(paragraph.innerText.trim());
    const voice = narrationVoice();
    utterance.lang = voice?.lang || "zh-CN";
    utterance.rate = 1;
    if (voice) {
      utterance.voice = voice;
      controls.dataset.voiceName = voice.name;
      controls.dataset.voiceLang = voice.lang;
      controls.dataset.voiceFallback = "false";
    } else {
      controls.dataset.voiceName = "system-default";
      controls.dataset.voiceLang = utterance.lang;
      controls.dataset.voiceFallback = "true";
    }
    utterance.onend = () => {
      if (activeSession !== session) return;
      paragraphIndex += 1;
      speakNext(activeSession);
    };
    utterance.onerror = event => {
      if (activeSession !== session || event.error === "canceled" || event.error === "interrupted") return;
      stop("当前浏览器无法继续朗读，请重试");
    };
    synth.speak(utterance);
  }

  function play() {
    if (!synth || typeof window.SpeechSynthesisUtterance !== "function") {
      update("idle", "当前浏览器不支持剧情听读");
      return;
    }
    if (state !== "idle") return;
    synth.cancel();
    session += 1;
    paragraphIndex = 0;
    update("playing", "正在播放 EP01 剧情");
    speakNext(session);
  }

  function pause() {
    if (state !== "playing") return;
    synth.pause();
    update("paused", "已暂停");
  }

  function resume() {
    if (state !== "paused") return;
    synth.resume();
    update("playing", "继续播放 EP01 剧情");
  }

  controls.addEventListener("click", event => {
    const action = event.target.closest("button")?.dataset.listen;
    if (action === "play") play();
    if (action === "pause") pause();
    if (action === "resume") resume();
    if (action === "stop") stop();
  });

  function setChapter(nextChapterId) {
    if (nextChapterId !== "ep01") stop("已离开 EP01，播放停止");
    chapterId = nextChapterId;
    controls.hidden = chapterId !== "ep01";
  }

  window.addEventListener("beforeunload", () => synth?.cancel());
  window.EP01Listening = { setChapter, stop };
  setChapter(chapterId);
})();
