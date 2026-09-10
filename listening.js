(function () {
  "use strict";

  const story = document.getElementById("story");
  const meta = document.querySelector(".reader-meta");
  const synth = window.speechSynthesis;
  let chapterId = "ep01";
  let state = "idle";
  let paragraphIndex = 0;
  let session = 0;
  let startTimer = null;
  let currentUtterance = null;
  const warning = "当前浏览器暂不支持听书，请尝试 Chrome / Edge";
  const diagnostics = [];

  if (!story || !meta) {
    console.error("[EP01 listening] CONTROLS_DOM_MISSING");
    return;
  }

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

  const buttons = {};
  controls.querySelectorAll("button").forEach(button => {
    buttons[button.dataset.listen] = button;
  });
  const status = controls.querySelector(".listening-status");

  const diagnosticPanel = document.createElement("details");
  const diagnosticSummary = document.createElement("summary");
  const diagnosticLog = document.createElement("pre");
  diagnosticSummary.textContent = "播放诊断";
  diagnosticPanel.appendChild(diagnosticSummary);
  diagnosticPanel.appendChild(diagnosticLog);
  controls.appendChild(diagnosticPanel);
  diagnosticPanel.style.cssText = "flex-basis:100%;min-width:0;font-size:12px";
  diagnosticLog.style.cssText = "white-space:pre-wrap;overflow-wrap:anywhere";

  function record(event, value) {
    const line = event + (value === undefined ? "" : ": " + value);
    diagnostics.push(line);
    if (diagnostics.length > 60) diagnostics.shift();
    diagnosticLog.textContent = diagnostics.join("\n");
    console.info("[EP01 listening] " + line);
  }

  function clearStartTimer() {
    clearTimeout(startTimer);
    startTimer = null;
  }

  function fail(reason) {
    record("PLAY_FAILED", reason);
    // Invalidate callbacks before cancel, which may synchronously emit an error.
    session += 1;
    clearStartTimer();
    currentUtterance = null;
    try { if (synth) synth.cancel(); } catch (error) { record("cancel error", error.message); }
    clearHighlight();
    paragraphIndex = 0;
    update("idle", warning);
    diagnosticPanel.open = true;
  }

  function paragraphs() {
    return [...story.querySelectorAll("p")];
  }

  function clearHighlight() {
    paragraphs().forEach(paragraph => paragraph.classList.remove("listening-active"));
  }

  function update(nextState, message) {
    state = nextState;
    buttons.play.disabled = nextState !== "idle";
    buttons.pause.disabled = nextState !== "playing";
    buttons.resume.disabled = nextState !== "paused";
    buttons.stop.disabled = nextState === "idle";
    status.textContent = message;
  }

  function narrationVoice() {
    let voices = [];
    try { voices = synth.getVoices() || []; }
    catch (error) { record("getVoices error", error.message); }
    record("voice count", voices.length);
    const natural = /Natural|Neural|Online|Premium|Enhanced|自然/i;
    return voices.find(voice => /^zh(-|_)(CN|TW|HK)/i.test(voice.lang) && natural.test(voice.name))
      || voices.find(voice => /^zh(-|_)/i.test(voice.lang))
      || null;
  }

  function stop(message = "已停止") {
    session += 1;
    clearStartTimer();
    currentUtterance = null;
    if (synth) synth.cancel();
    paragraphIndex = 0;
    clearHighlight();
    update("idle", message);
  }

  function speakNext(activeSession) {
    if (activeSession !== session || (state !== "playing" && state !== "starting")) return;
    const items = paragraphs();
    if (paragraphIndex >= items.length) {
      stop("本章播放完成");
      return;
    }
    clearHighlight();
    const paragraph = items[paragraphIndex];
    paragraph.classList.add("listening-active");
    try {
      const utterance = new window.SpeechSynthesisUtterance(paragraph.innerText.trim());
      const voice = narrationVoice();
      utterance.lang = (voice && voice.lang) || "zh-CN";
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
      currentUtterance = utterance;
      utterance.onstart = () => {
        if (activeSession !== session || currentUtterance !== utterance) return;
        clearStartTimer();
        record("onstart");
        update("playing", "正在播放 EP01 剧情");
      };
      utterance.onend = () => {
        if (activeSession !== session) return;
        clearStartTimer();
        record("onend");
        paragraphIndex += 1;
        speakNext(activeSession);
      };
      utterance.onerror = event => {
        if (activeSession !== session) return;
        record("onerror", event.error);
        fail(event.error || "语音播放错误");
      };
      clearStartTimer();
      startTimer = setTimeout(() => {
        if (activeSession === session) fail("onstart timeout (8000ms)");
      }, 8000);
      // Keep the first speak synchronous with the user's click. Never await voices.
      record("speak() called");
      synth.speak(utterance);
    } catch (error) { fail(error.message || "speak exception"); }
  }

  function play() {
    record("PLAY_CLICK_RECEIVED");
    status.textContent = "已收到播放点击，正在启动…";
    record("speechSynthesis exists", !!synth);
    record("SpeechSynthesisUtterance exists", typeof window.SpeechSynthesisUtterance === "function");
    if (!synth || typeof synth.speak !== "function" || typeof window.SpeechSynthesisUtterance !== "function") {
      fail("speech API unavailable");
      return;
    }
    if (state !== "idle") return;
    try { synth.cancel(); } catch (error) { fail(error.message); return; }
    session += 1;
    paragraphIndex = 0;
    update("starting", "已收到播放点击，正在启动…");
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
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    const action = button.dataset.listen;
    if (action === "play") play();
    if (action === "pause") pause();
    if (action === "resume") resume();
    if (action === "stop") stop();
  });

  record("PLAY_BUTTON_BOUND", !!buttons.play && controls.contains(buttons.play));

  function setChapter(nextChapterId) {
    if (nextChapterId !== "ep01") stop("已离开 EP01，播放停止");
    chapterId = nextChapterId;
    controls.hidden = chapterId !== "ep01";
  }

  window.addEventListener("beforeunload", () => { if (synth) synth.cancel(); });
  window.EP01Listening = { setChapter, stop, diagnostics };
  setChapter(chapterId);
})();
