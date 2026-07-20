(() => {
  const root = document.documentElement;
  const isEnglish = root.lang === "en";
  const copy = isEnglish ? {
    kicker: "Tool detail",
    close: "Close",
    open: "Open tool",
    use: "Best used for",
    why: "Why this week",
  } : {
    kicker: "工具详情",
    close: "关闭",
    open: "打开工具",
    use: "适合什么时候用",
    why: "本周推荐理由",
  };
  const cards = [...document.querySelectorAll(".tool-card")];
  if (!cards.length) return;
  const drawer = document.createElement("aside");
  drawer.className = "tool-detail-drawer";
  drawer.setAttribute("aria-live", "polite");
  drawer.innerHTML = `<button class="tool-detail-close" type="button" aria-label="${copy.close}">×</button>
    <div class="inspector-kicker">${copy.kicker}</div><h2></h2><p class="tool-detail-summary"></p>
    <dl><dt>${copy.use}</dt><dd class="tool-detail-use"></dd><dt>${copy.why}</dt><dd class="tool-detail-why"></dd></dl>
    <a target="_blank" rel="noopener"></a>`;
  document.body.appendChild(drawer);
  const close = () => {
    drawer.classList.remove("open");
    document.body.classList.remove("tool-detail-open");
    cards.forEach(card => card.classList.remove("is-selected"));
  };
  drawer.querySelector(".tool-detail-close").addEventListener("click", close);
  const select = card => {
    cards.forEach(item => item.classList.toggle("is-selected", item === card));
    drawer.querySelector("h2").textContent = card.querySelector("h2")?.textContent?.trim() || "";
    drawer.querySelector(".tool-detail-summary").textContent = card.querySelector(".tool-card-head p")?.textContent?.trim() || "";
    const notes = card.querySelectorAll(".tool-notes dd");
    drawer.querySelector(".tool-detail-use").textContent = notes[0]?.textContent?.trim() || "";
    drawer.querySelector(".tool-detail-why").textContent = notes[1]?.textContent?.trim() || "";
    const link = drawer.querySelector("a");
    link.textContent = copy.open;
    link.href = card.querySelector(".tool-footer a")?.href || "#";
    drawer.classList.add("open");
    document.body.classList.add("tool-detail-open");
  };
  cards.forEach(card => card.addEventListener("click", event => {
    if (event.target.closest("a, button, input")) return;
    select(card);
  }));
  document.addEventListener("omnisource:tool-filter-change", event => {
    const visibleCards = event.detail?.visibleCards;
    if (!Array.isArray(visibleCards)) return;
    const selectedCard = cards.find(card => card.classList.contains("is-selected"));
    if (!selectedCard || visibleCards.includes(selectedCard)) return;
    close();
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
})();
