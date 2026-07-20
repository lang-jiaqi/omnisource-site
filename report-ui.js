(() => {
  const root = document.documentElement;
  const isEnglish = root.lang === "en";
  const copy = isEnglish ? {
    kicker: "Selected signal",
    empty: "Select a paper, post, or repository to see its context here.",
    source: "Source",
    open: "Open source",
    focus: "Focus item",
    close: "Close",
  } : {
    kicker: "当前信号",
    empty: "选择一篇论文、动态或开源项目，在这里查看上下文。",
    source: "来源",
    open: "打开来源",
    focus: "定位内容",
    close: "关闭",
  };

  const wrap = document.querySelector(".wrap");
  const panels = document.querySelector(".report-panels");
  if (!wrap || !panels) return;

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

  const visibleCards = () => [...panels.querySelectorAll(".track-panel:not([hidden]) .card")];
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
})();
