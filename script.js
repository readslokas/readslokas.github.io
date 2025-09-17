<div id="controls"></div>
// --- Speed Formula Setup ---

const baseSpeed = 20;       // 1.2x = 20 px/s
const growthFactor = 1.4;   // adjust curve steepness
const maxMultiplier = 7;    // show buttons up to 7x

// Continuous formula: maps multiplier (e.g. 2.0, 2.2, 3.4) → speed
function getSpeedForMultiplier(x) {
  if (x === 1) return 0.5;       // 1x = 0.5 px/s
  if (Math.abs(x - 1.2) < 0.001) return baseSpeed; // 1.2x = baseSpeed
  return baseSpeed * Math.pow(growthFactor, (x - 1.2));
}

// --- State ---

let currentMultiplier = 1;
let speedPixelsPerSecond = getSpeedForMultiplier(currentMultiplier);
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null; // which whole number is expanded
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
  if (expandedIndex === null || expandedIndex === maxMultiplier) {
    for (let i = 1; i <= maxMultiplier; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${i}x`;
      btn.onclick = () => handleSpeedClick(i);
      if (Math.abs(currentMultiplier - i) < 0.001) btn.classList.add("active");
      controls.appendChild(btn);
    }
    return;
  }

  // Expanded view for non-last buttons
  const prev = expandedIndex - 1;
  const curr = expandedIndex;
  const next = expandedIndex + 1;

  if (prev >= 1) {
    const btnPrev = document.createElement("button");
    btnPrev.textContent = `${prev}x`;
    btnPrev.onclick = () => handleSpeedClick(prev);
    controls.appendChild(btnPrev);
  }

  const btnCurr = document.createElement("button");
  btnCurr.textContent = `${curr}x`;
  btnCurr.classList.add("active");
  btnCurr.onclick = () => handleSpeedClick(curr);
  controls.appendChild(btnCurr);

  if (next <= maxMultiplier) {
    const finerButtons = generateFinerButtons(curr);
    finerButtons.forEach(({ label, value, multiplier }) => {
      const fineBtn = document.createElement("button");
      fineBtn.textContent = label;
      fineBtn.onclick = () => {
        speedPixelsPerSecond = value;
        currentMultiplier = multiplier;
        highlightButton(fineBtn);
      };
      if (Math.abs(currentMultiplier - multiplier) < 0.001) {
        fineBtn.classList.add("active");
      }
      controls.appendChild(fineBtn);
    });

    const btnNext = document.createElement("button");
    btnNext.textContent = `${next}x`;
    btnNext.onclick = () => handleSpeedClick(next);
    controls.appendChild(btnNext);
  }
}

function handleSpeedClick(multiplier) {
  if (multiplier === maxMultiplier) {
    // Last button: just select it, no expansion
    expandedIndex = null;
    speedPixelsPerSecond = getSpeedForMultiplier(multiplier);
  } else if (expandedIndex === multiplier) {
    expandedIndex = null;
  } else {
    expandedIndex = multiplier;
    speedPixelsPerSecond = getSpeedForMultiplier(multiplier);
  }
  currentMultiplier = multiplier;
  buildButtons();
}

// --- Fine Speed Calculation (continuous curve) ---

function generateFinerButtons(baseMultiplier) {
  const fineSpeeds = [];

  for (let i = 1; i < 5; i++) {
    const step = i * 0.2; // 0.2x increments
    const multiplier = baseMultiplier + step; // e.g. 2.2, 2.4, 3.2
    const label = `${multiplier.toFixed(1)}x`;
    const value = getSpeedForMultiplier(multiplier);

    fineSpeeds.push({ label, value, multiplier });
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
      console.log('Wake Lock is active');

      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock was released');
      });
    } else {
      console.warn('Wake Lock API not supported on this browser.');
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
  requestWakeLock(); // Prevent screen from sleeping
};