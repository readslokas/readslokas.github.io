// ---------------------------------------------------------------------
// HARD-CODED SPEED TABLE (all speeds 1.0 → 7.0 including 0.2 steps)
// ---------------------------------------------------------------------

const speedTable = [
  0.5,   // 1.0x
  20,    // 1.2x
  28,    // 1.4x
  36,    // 1.6x
  44,    // 1.8x
  52,    // 2.0x
  60,    // 2.2x
  68,    // 2.4x
  76,    // 2.6x
  84,    // 2.8x
  92,    // 3.0x
  100,   // 3.2x
  108,   // 3.4x
  116,   // 3.6x
  124,   // 3.8x
  132,   // 4.0x
  140,   // 4.2x
  148,   // 4.4x
  156,   // 4.6x
  164,   // 4.8x
  172,   // 5.0x
  180,   // 5.2x
  188,   // 5.4x
  196,   // 5.6x
  204,   // 5.8x
  212,   // 6.0x
  220,   // 6.2x
  228,   // 6.4x
  236,   // 6.6x
  244,   // 6.8x
  252    // 7.0x
];

// maps main-button indexes (0-6) → corresponding speedTable index
const mainIndices = [0, 5, 10, 15, 20, 25, 30];

// main button labels
const mainLabels = ["1x", "2x", "3x", "4x", "5x", "6x", "7x"];

// ---------------------------------------------------------------------

let currentMainIndex = 0;
let speedPixelsPerSecond = speedTable[mainIndices[0]];
let expandedIndex = null;

let lastTimestamp = null;
let animationFrameId = null;
let wakeLock = null;


// ---------------------------------------------------------------------
// SCROLLING
// ---------------------------------------------------------------------

function smoothScroll(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;

  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  const distance = speedPixelsPerSecond * deltaTime;
  window.scrollTo(0, window.scrollY + distance);

  animationFrameId = requestAnimationFrame(smoothScroll);
}

function startAutoScroll() {
  cancelAnimationFrame(animationFrameId);
  lastTimestamp = null;
  animationFrameId = requestAnimationFrame(smoothScroll);
}


// ---------------------------------------------------------------------
// UI BUTTONS
// ---------------------------------------------------------------------

function buildButtons() {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";

  // COLLAPSED MODE (default)
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

  // EXPANDED MODE
  const prev = expandedIndex - 1;
  const next = expandedIndex + 1;

  // left neighbor
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

  // finer buttons between mainIndices[x] and mainIndices[x+1]
  if (next < mainIndices.length) {
    const fineButtons = generateFineButtons(expandedIndex);
    fineButtons.forEach(({ label, value }) => {
      const fineBtn = document.createElement("button");
      fineBtn.textContent = label;
      fineBtn.onclick = () => {
        speedPixelsPerSecond = value;
        highlightButton(fineBtn);
        currentMainIndex = -1;
      };
      controls.appendChild(fineBtn);
    });

    // right neighbor
    const btnNext = document.createElement("button");
    btnNext.textContent = mainLabels[next];
    btnNext.onclick = () => handleMainClick(next);
    controls.appendChild(btnNext);
  }
}

function handleMainClick(idx) {
  if (expandedIndex === idx) {
    expandedIndex = null; // collapse
  } else {
    expandedIndex = idx;  // expand this button
  }

  currentMainIndex = idx;
  speedPixelsPerSecond = speedTable[mainIndices[idx]];

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

  const startX = mainIndex + 1;       // 1x, 2x, 3x, etc.
  const fine = [];

  for (let i = 1; i <= 4; i++) {
    const x = startX + i * 0.2;
    const label = `${x.toFixed(1)}x`;

    const fraction = i * 0.2; // 0.2, 0.4, 0.6, 0.8
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
