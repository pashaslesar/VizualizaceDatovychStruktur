function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

const q          = document.querySelector<HTMLInputElement>("#search")!;
const tagModeBtn = document.querySelector<HTMLButtonElement>("#tagModeBtn")!;
const grid       = document.querySelector<HTMLDivElement>("#grid")!;
const cards      = Array.from(grid.querySelectorAll<HTMLElement>(".card"));
const empty      = document.querySelector<HTMLElement>("#empty")!;

let tagMode = false;

function applyFilter(text: string) {
  const needle = normalize(text);
  let visible = 0;

  cards.forEach(card => {
    const haystack = tagMode
      ? normalize(card.dataset.tags || "")
      : normalize(card.dataset.name || "");
    const ok = needle === "" || haystack.includes(needle);
    card.toggleAttribute("hidden", !ok);
    if (ok) visible++;
  });

  empty.toggleAttribute("hidden", visible > 0);
}

tagModeBtn.addEventListener("click", () => {
  tagMode = !tagMode;
  tagModeBtn.classList.toggle("active", tagMode);
  q.placeholder = tagMode
    ? "Hledat podle štítků: lifo, fifo, tree…"
    : "Hledat: linked list, stack, queue…";
  applyFilter(q.value);
});

q.addEventListener("input", () => applyFilter(q.value));

window.addEventListener("keydown", (e) => {
  if (e.key === "/" && (document.activeElement as HTMLElement)?.tagName !== "INPUT") {
    e.preventDefault();
    q.focus();
  }
  if (e.key === "Escape") {
    q.value = "";
    applyFilter("");
    q.blur();
  }
  if (e.key === "Enter" && document.activeElement === q) {
    const first = cards.find(c => !c.hasAttribute("hidden"));
    const link = first?.querySelector<HTMLAnchorElement>(".card-link:not(.soon)");
    if (link) link.click();
  }
});

applyFilter("");
