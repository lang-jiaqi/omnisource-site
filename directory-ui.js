(() => {
  const root = document.documentElement;
  const canvas = document.getElementById("directoryAperture");
  const aperture = document.querySelector(".directory-aperture");
  const menu = document.getElementById("directoryMenu");
  const menuButton = document.querySelector(".directory-menu-button");
  const menuClose = document.querySelector(".directory-menu-close");
  const themeButton = document.getElementById("directoryTheme");
  const savedTheme = localStorage.getItem("omnisource-theme") || "dark";
  root.dataset.theme = savedTheme;

  const syncTheme = () => {
    const light = root.dataset.theme === "light";
    if (themeButton) themeButton.textContent = light ? "☀" : "☾";
  };
  themeButton?.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("omnisource-theme", root.dataset.theme);
    syncTheme();
  });
  syncTheme();

  const setMenu = open => {
    if (!menu || !menuButton) return;
    menu.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
    if (open) menuClose?.focus();
  };
  menuButton?.addEventListener("click", () => setMenu(true));
  menuClose?.addEventListener("click", () => setMenu(false));
  menu?.addEventListener("click", event => { if (event.target === menu) setMenu(false); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") setMenu(false); });

  if (!canvas || !aperture) return;
  const ctx = canvas.getContext("2d");
  const pointer = { x: .5, y: .5, active: false };
  let width = 0;
  let height = 0;
  let dpr = 1;
  const resize = () => {
    const rect = aperture.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  aperture.addEventListener("pointermove", event => {
    const rect = aperture.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
    pointer.active = true;
  });
  aperture.addEventListener("pointerleave", () => { pointer.active = false; });
  window.addEventListener("resize", resize);

  const draw = time => {
    const t = time * .001;
    ctx.clearRect(0, 0, width, height);
    const targetX = pointer.active ? pointer.x * width : width * .52;
    const targetY = pointer.active ? pointer.y * height : height * .48;
    const radius = Math.min(width, height) * .45;
    ctx.save();
    ctx.translate(targetX, targetY);
    ctx.globalCompositeOperation = "lighter";

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.2);
    glow.addColorStop(0, "rgba(237, 255, 251, .18)");
    glow.addColorStop(.15, "rgba(140, 232, 221, .16)");
    glow.addColorStop(.48, "rgba(137, 154, 255, .08)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-radius * 1.4, -radius * 1.4, radius * 2.8, radius * 2.8);

    for (let index = 1; index <= 9; index += 1) {
      const ring = radius * index / 9;
      ctx.globalAlpha = .2 - index * .012;
      ctx.strokeStyle = index % 2 ? "rgba(137, 154, 255, .76)" : "rgba(140, 232, 221, .68)";
      ctx.lineWidth = index === 9 ? 1.5 : .8;
      ctx.setLineDash(index % 2 ? [2, 11] : [1, 20]);
      ctx.beginPath();
      ctx.arc(0, 0, ring + Math.sin(t * .3 + index) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const sweep = t * .32;
    ctx.globalAlpha = .8;
    ctx.strokeStyle = "rgba(140, 232, 221, .48)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweep) * radius, Math.sin(sweep) * radius);
    ctx.stroke();
    ctx.globalAlpha = .8;
    ctx.fillStyle = "rgba(239, 255, 251, .9)";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    requestAnimationFrame(draw);
  };
  resize();
  requestAnimationFrame(draw);
})();
