// ---------------------------------------------------------------------
// HARD-CODED SPEED TABLE (all speeds 1.0 → 7.0 including 0.2 steps)
// ---------------------------------------------------------------------

const speedTable = [
  0.5,   // 1.0x
  26,    // 1.2x
  28,    // 1.4x
  30,    // 1.6x
  32,    // 1.8x
  36,    // 2.0x
  40,    // 2.2x
  44,    // 2.4x
  46,    // 2.6x
  48,    // 2.8x
  50,    // 3.0x
  52,    // 3.2x
  54,    // 3.4x
  56,    // 3.6x
  58,    // 3.8x
  60,    // 4.0x
  62,    // 4.2x
  64,    // 4.4x
  66,    // 4.6x
  68,    // 4.8x
  70,    // 5.0x
  72,    // 5.2x
  74,    // 5.4x
  78,    // 5.6x
  80,    // 5.8x
  81,    // 6.0x
  82,    // 6.2x
  83,    // 6.4x
  84,    // 6.6x
  85,    // 6.8x
  86,    // 7.0x
];

// Main button references
const mainIndices = [0, 5, 10, 15, 20, 25, 30];
const mainLabels  = ["1x", "2x", "3x", "4x", "5x", "6x", "7x"];

// ---------------------------------------------------------------------

let currentMainIndex = 0;
let speedPixelsPerSecond = speedTable[mainIndices[0]];
let expandedIndex = null;

let lastTimestamp = null;
let animationFrameId = null;
let wakeLock = null;

// ✅ NEW: accumulator to preserve fractional pixels
let scrollAccumulator = 0;


// ---------------------------------------------------------------------
// SCROLLING (FIXED — smooth at low speeds)
// ---------------------------------------------------------------------

function smoothScroll(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;

  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  scrollAccumulator += speedPixelsPerSecond * deltaTime;

  const wholePixels = Math.floor(scrollAccumulator);
  if (wholePixels !== 0) {
    window.scrollBy(0, wholePixels);
    scrollAccumulator -= wholePixels;
  }

  animationFrameId = requestAnimationFrame(smoothScroll);
}

function startAutoScroll() {
  cancelAnimationFrame(animationFrameId);
  lastTimestamp = null;
  scrollAccumulator = 0;
  animationFrameId = requestAnimationFrame(smoothScroll);
}


// ---------------------------------------------------------------------
// UI BUTTONS
// ---------------------------------------------------------------------

function buildButtons() {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";

  // ----------------------------
  // COLLAPSED MODE: show only 1x..7x
  // ----------------------------
  if (expandedIndex === null) {
    mainLabels.forEach((label, idx) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.onclick = () => handleMainClick(idx);
      if (idx === currentMainIndex) btn.classList.add("active");
      controls.appendChild(btn);
    });
    return;
  }

  // ----------------------------
  // EXPANDED MODE
  // ----------------------------
  const lastMain = mainIndices.length - 1;

  // SPECIAL CASE: if user clicked 7x → show ALL main buttons
  if (expandedIndex === lastMain) {
    mainLabels.forEach((label, idx) => {
      const btn = document.createElement("button");
      btn.textContent = label;

      if (idx === expandedIndex) btn.classList.add("active");

      btn.onclick = () => handleMainClick(idx);
      controls.appendChild(btn);
    });
    return;
  }

  const prev = expandedIndex - 1;
  const next = expandedIndex + 1;

  // left neighbour
  if (prev >= 0) {
    const btnPrev = document.createElement("button");
    btnPrev.textContent = mainLabels[prev];
    btnPrev.onclick = () => handleMainClick(prev);
    controls.appendChild(btnPrev);
  }

  // current main button
  const btnCurr = document.createElement("button");
  btnCurr.textContent = mainLabels[expandedIndex];
  btnCurr.classList.add("active");
  btnCurr.onclick = () => handleMainClick(expandedIndex);
  controls.appendChild(btnCurr);

  // fine buttons (0.2 increments)
  const fineButtons = generateFineButtons(expandedIndex);
  fineButtons.forEach(({ label, value }) => {
    const fineBtn = document.createElement("button");
    fineBtn.textContent = label;
    fineBtn.onclick = () => {
      speedPixelsPerSecond = value;
      currentMainIndex = -1;
      highlightButton(fineBtn);
      scrollAccumulator = 0;
    };
    controls.appendChild(fineBtn);
  });

  // right neighbour
  const btnNext = document.createElement("button");
  btnNext.textContent = mainLabels[next];
  btnNext.onclick = () => handleMainClick(next);
  controls.appendChild(btnNext);
}

function handleMainClick(idx) {
  // toggle expand/collapse
  expandedIndex = expandedIndex === idx ? null : idx;

  currentMainIndex = idx;
  speedPixelsPerSecond = speedTable[mainIndices[idx]];
  scrollAccumulator = 0;

  buildButtons();
}


// ---------------------------------------------------------------------
// GENERATE 0.2 STEP BUTTONS
// ---------------------------------------------------------------------

function generateFineButtons(mainIndex) {
  const startIndex = mainIndices[mainIndex];
  const endIndex = mainIndices[mainIndex + 1];

  const currSpeed = speedTable[startIndex];
  const nextSpeed = speedTable[endIndex];

  const startX = mainIndex + 1;
  const fine = [];

  for (let i = 1; i <= 4; i++) {
    const x = startX + i * 0.2;
    const label = `${x.toFixed(1)}x`;

    const fraction = i * 0.2;
    const value = currSpeed + (nextSpeed - currSpeed) * fraction;

    fine.push({ label, value });
  }

  return fine;
}


// ---------------------------------------------------------------------
// UI HIGHLIGHTING
// ---------------------------------------------------------------------

function highlightButton(activeBtn) {
  document.querySelectorAll("#controls button").forEach(btn => {
    btn.classList.toggle("active", btn === activeBtn);
  });
}


// ---------------------------------------------------------------------
// WAKE LOCK
// ---------------------------------------------------------------------

async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("visibilitychange", () => {
  if (wakeLock && document.visibilityState === "visible") {
    requestWakeLock();
  }
});


// ---------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------

window.onload = () => {
  buildButtons();
  startAutoScroll();
  requestWakeLock();
};
