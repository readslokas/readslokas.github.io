// --- Speed Table Setup (HARD-CODED WITH MATCHING LABELS) ---

let speedLabels = [
  "1.0x",
  "1.2x",
  "1.4x",
  "1.6x",
  "1.8x",
  "2.0x",
  "2.2x",
  "2.4x",
  "2.6x",
  "2.8x",
  "3.0x",
  "3.2x",
  "3.4x",
  "3.6x",
  "3.8x",
  "4.0x",
  "4.2x",
  "4.4x",
  "4.6x",
  "4.8x",
  "5.0x",
  "5.2x",
  "5.4x",
  "5.6x",
  "5.8x",
  "6.0x",
  "6.2x",
  "6.4x",
  "6.6x",
  "6.8x",
  "7.0x"
];

let speedTable = [
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

// --- State ---

let currentSpeedIndex = 0;
let speedPixelsPerSecond = speedTable[0];
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null;
let wakeLock = null;

// --- Scrolling ---

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

// --- UI Buttons ---

function buildButtons() {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";

  // Special case: last index (7x) should never collapse
  if (expandedIndex === null || expandedIndex === speedTable.length - 1) {
     for (let i = 0; i < speedTable.length; i++) {
       const btn = document.createElement("button");
       btn.textContent = speedLabels[i];
       btn.onclick = () => handleSpeedClick(i);
       if (i === currentSpeedIndex) btn.classList.add("active");
       controls.appendChild(btn);
     }
     return;
  }

  const prev = expandedIndex - 1;
  const curr = expandedIndex;
  const next = expandedIndex + 1;

  if (prev >= 0) {
    const btnPrev = document.createElement("button");
    btnPrev.textContent = speedLabels[prev];
    btnPrev.onclick = () => handleSpeedClick(prev);
    controls.appendChild(btnPrev);
  }

  const btnCurr = document.createElement("button");
  btnCurr.textContent = speedLabels[curr];
  btnCurr.classList.add("active");
  btnCurr.onclick = () => handleSpeedClick(curr);
  controls.appendChild(btnCurr);

  if (next < speedTable.length) {
    const finerButtons = generateFinerButtons(curr);
    finerButtons.forEach(({ label, value }) => {
      const fineBtn = document.createElement("button");
      fineBtn.textContent = label;
      fineBtn.onclick = () => {
        speedPixelsPerSecond = value;
        currentSpeedIndex = -1;
        highlightButton(fineBtn);
      };
      controls.appendChild(fineBtn);
    });

    const btnNext = document.createElement("button");
    btnNext.textContent = speedLabels[next];
    btnNext.onclick = () => handleSpeedClick(next);
    controls.appendChild(btnNext);
  }
}

function handleSpeedClick(index) {
  if (index === speedTable.length - 1) {
    expandedIndex = null;
    speedPixelsPerSecond = speedTable[index];
  } else if (expandedIndex === index) {
    expandedIndex = null;
  } else {
    expandedIndex = index;
    speedPixelsPerSecond = speedTable[index];
  }
  currentSpeedIndex = index;
  buildButtons();
}

// --- Fine Speed Calculation (linear interpolation) ---

function generateFinerButtons(index) {
  const fineSpeeds = [];
  const currSpeed = speedTable[index];
  const nextSpeed = speedTable[index + 1];

  for (let i = 1; i < 5; i++) {
    const step = i * 0.2; // 0.2 increments
    const xValue = parseFloat(speedLabels[index]) + step; 
    const label = `${xValue.toFixed(1)}x`;

    const fraction = step;
    const interpolatedValue = currSpeed + (nextSpeed - currSpeed) * fraction;

    fineSpeeds.push({ label, value: interpolatedValue });
  }

  return fineSpeeds;
}

function highlightButton(activeBtn) {
  document.querySelectorAll("#controls button").forEach(btn => {
    btn.classList.toggle("active", btn === activeBtn);
  });
}

// --- Wake Lock ---

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {});
    }
  } catch (err) {
    console.error(`${err.name}, ${err.message}`);
  }
}

document.addEventListener('visibilitychange', () => {
  if (wakeLock !== null && document.visibilityState === 'visible') {
    requestWakeLock();
  }
});

// --- Init ---

window.onload = () => {
  buildButtons();
  startAutoScroll();
  requestWakeLock();
};
