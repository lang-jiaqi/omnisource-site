(() => {
  const feedbackKey = "omnisource-item-feedback";
  const splitValues = value => String(value || "").split(",").map(item => item.trim().toLowerCase()).filter(Boolean);
  const splitTopic = value => splitValues(value);
  const overlapCount = (left, right) => {
    const rightValues = new Set(right);
    return [...new Set(left)].filter(item => rightValues.has(item)).length;
  };
  const preferenceScore = (candidate, entries) => {
    let total = 0;
    let matches = 0;
    const candidateTopic = splitTopic(candidate.topic);
    const candidateKeywords = splitValues(candidate.keywords);
    const candidateSources = splitValues(candidate.sources);
    entries.forEach(entry => {
      if (String(entry.track || "") !== String(candidate.track || "")) return;
      const direction = entry.vote === "up" ? 1 : -1;
      let similarity = 0;
      if (entry.id && entry.type === candidate.type && entry.id === candidate.id) similarity += 4;
      const entryTopic = splitTopic(entry.topic);
      if (candidateTopic.length && entryTopic.length) {
        similarity += candidate.topic === entry.topic ? 2 : Math.min(1.5, overlapCount(candidateTopic, entryTopic) * 0.5);
      }
      similarity += Math.min(1.8, overlapCount(candidateKeywords, splitValues(entry.keywords)) * 0.45);
      similarity += Math.min(0.6, overlapCount(candidateSources, splitValues(entry.sources)) * 0.2);
      if (!similarity) return;
      total += direction * similarity;
      matches += 1;
    });
    if (!matches) return 0;
    return Math.max(-4, Math.min(4, total / Math.sqrt(matches)));
  };
  const rankCandidates = (candidates, entries) => {
    const poolSize = Math.max(1, candidates.length);
    return candidates.map(candidate => {
      const baseRank = Math.max(1, Number(candidate.baseRank) || poolSize);
      const baseScore = 1 - ((baseRank - 1) / poolSize);
      return { ...candidate, score: baseScore + 0.4 * preferenceScore(candidate, entries) };
    }).sort((left, right) => right.score - left.score || left.baseRank - right.baseRank);
  };
  if (typeof module !== "undefined" && module.exports) module.exports = { preferenceScore, rankCandidates };
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const isEnglish = root.lang === "en";
  const copy = isEnglish ? {
    kicker: "Selected signal",
    empty: "Select a paper, post, or repository to see its context here.",
    source: "Source",
    open: "Open source",
    focus: "Focus item",
    close: "Close",
    voicePlay: "Play full episode",
    voicePause: "Pause episode",
  } : {
    kicker: "当前信号",
    empty: "选择一篇论文、动态或开源项目，在这里查看上下文。",
    source: "来源",
    open: "打开来源",
    focus: "定位内容",
    close: "关闭",
    voicePlay: "播放整期语音日报",
    voicePause: "暂停语音日报",
  };

  const wrap = document.querySelector(".wrap");
  const panels = document.querySelector(".report-panels");
  if (!wrap || !panels) return;

  const feedbackEntries = () => {
    try {
      const entries = JSON.parse(localStorage.getItem(feedbackKey) || "[]");
      return Array.isArray(entries) ? entries : [];
    } catch (_) {
      return [];
    }
  };
  const cardCandidate = card => {
    const feedback = card.querySelector(".item-feedback")?.dataset || {};
    return {
      element: card,
      baseRank: Number(card.dataset.personalizationRank || 0),
      id: feedback.feedbackId || "",
      type: feedback.feedbackItemType || "item",
      track: feedback.feedbackTrack || "",
      topic: feedback.feedbackTopic || "",
      keywords: feedback.feedbackKeywords || "",
      sources: feedback.feedbackSources || "",
    };
  };
  const applyPersonalization = () => {
    const entries = feedbackEntries();
    panels.querySelectorAll(".signal-section[data-personalization-limit]").forEach(section => {
      const feed = section.querySelector(".signal-feed");
      if (!feed) return;
      const limit = Math.max(0, Number(section.dataset.personalizationLimit || 0));
      const candidates = [...feed.querySelectorAll(":scope > .card")].map(cardCandidate);
      const track = candidates[0]?.track || "";
      const preferences = entries.filter(entry => String(entry.track || "") === track);
      if (!preferences.length) return;
      const ranked = rankCandidates(candidates, preferences);
      feed.classList.add("personalized");
      ranked.forEach((candidate, index) => {
        candidate.element.hidden = index >= limit;
        const label = candidate.element.querySelector(".feed-index");
        if (label) label.textContent = String(index + 1).padStart(2, "0");
        feed.appendChild(candidate.element);
      });
    });
  };
  applyPersonalization();

  const inspector = document.createElement("aside");
  inspector.className = "signal-inspector";
  inspector.setAttribute("aria-live", "polite");
  inspector.innerHTML = `<div class="inspector-kicker">${copy.kicker}</div>
    <div class="inspector-title"></div>
    <div class="inspector-meta"></div>
    <div class="inspector-copy">${copy.empty}</div>
    <div class="inspector-source"></div>
    <div class="inspector-actions"><a class="inspector-action primary" target="_blank" rel="noopener"></a>
      <button type="button" class="inspector-action"></button></div>`;
  wrap.insertBefore(inspector, wrap.querySelector("footer"));

  const title = inspector.querySelector(".inspector-title");
  const meta = inspector.querySelector(".inspector-meta");
  const detail = inspector.querySelector(".inspector-copy");
  const source = inspector.querySelector(".inspector-source");
  const open = inspector.querySelector("a");
  const focus = inspector.querySelector("button");

  const visibleCards = () => [...panels.querySelectorAll(".track-panel:not([hidden]) .card:not([hidden])")];
  const cardSourceUrl = card => card.querySelector(".item-feedback")?.dataset.feedbackUrl
    || card.querySelector(".links a")?.href || "";
  const select = card => {
    if (!card) return;
    panels.querySelectorAll(".card.is-focused").forEach(item => item.classList.remove("is-focused"));
    card.classList.add("is-focused");
    const heading = card.querySelector("h3")?.textContent?.trim() || "";
    const authors = card.querySelector(".auth")?.textContent?.trim() || "";
    const date = card.querySelector(".meta")?.textContent?.trim() || "";
    const signal = card.querySelector(".source-signal-link")?.textContent?.trim() || "";
    const inference = card.querySelector(".inference p")?.textContent?.trim()
      || card.querySelector(".method-brief p")?.textContent?.trim() || "";
    const url = cardSourceUrl(card);
    title.textContent = heading;
    meta.textContent = [authors, date].filter(Boolean).join(" · ");
    detail.textContent = inference || copy.empty;
    source.textContent = signal ? `${copy.source} · ${signal}` : "";
    open.textContent = copy.open;
    open.href = url || "#";
    open.hidden = !url;
    focus.textContent = copy.focus;
    focus.onclick = () => card.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const bindCards = () => panels.querySelectorAll(".card").forEach(card => {
    if (card.dataset.reportUiBound) return;
    card.dataset.reportUiBound = "true";
    card.tabIndex = 0;
    card.addEventListener("click", event => {
      if (event.target.closest("a, button, summary, input, textarea")) return;
      select(card);
    });
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(card); }
    });
  });
  bindCards();
  select(visibleCards()[0]);

  document.addEventListener("keydown", event => {
    if (event.key !== "j" && event.key !== "k") return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    const cards = visibleCards();
    const current = cards.findIndex(card => card.classList.contains("is-focused"));
    const next = event.key === "j" ? Math.min(cards.length - 1, current + 1) : Math.max(0, current - 1);
    if (cards[next]) { event.preventDefault(); select(cards[next]); cards[next].scrollIntoView({ behavior: "smooth", block: "center" }); }
  });

  document.querySelectorAll(".track-tab").forEach(tab => tab.addEventListener("click", () => {
    window.setTimeout(() => { bindCards(); select(visibleCards()[0]); }, 0);
  }));
  document.addEventListener("omnisource:feedback-changed", () => {
    applyPersonalization();
    bindCards();
    const focused = panels.querySelector(".card.is-focused:not([hidden])");
    if (!focused) select(visibleCards()[0]);
  });

})();
