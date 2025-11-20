// --- Hardcoded Speed Table (1x to 7x) ---
// First button (1x) = 0.5 px/s, rest are hardcoded
const speedTable = [0.5, 20, 40, 60, 90, 130, 180]; // px/s
let currentSpeedIndex = 0;
let speedPixelsPerSecond = speedTable[0];
let expandedIndex = null;
let lastTimestamp = null;
let animationFrameId = null;
let wakeLock = null;

// --- Auto Scroll ---
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

// --- Build Buttons ---
function buildButtons() {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";

  // Show all main buttons if nothing is expanded or last button
  if (expandedIndex === null || expandedIndex === speedTable.length - 1) {
    speedTable.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.textContent = `${i + 1}x`;
      btn.classList.toggle("active", i === currentSpeedIndex);
      btn.onclick = () => handleSpeedClick(i);
      controls.appendChild(btn);
    });
    return;
  }

  const prev = expandedIndex - 1;
  const curr = expandedIndex;
  const next = expandedIndex + 1;

  if (prev >= 0) {
    const btnPrev = document.createElement("button");
    btnPrev.textContent = `${prev + 1}x`;
    btnPrev.onclick = () => handleSpeedClick(prev);
    controls.appendChild(btnPrev);
  }

  // Current main button (expanded)
  const btnCurr = document.createElement("button");
  btnCurr.textContent = `${curr + 1}x`;
  btnCurr.classList.add("active");
  btnCurr.onclick = () => handleSpeedClick(curr);
  controls.appendChild(btnCurr);

  // Fine buttons between current and next
  if (next < speedTable.length) {
    generateFinerButtons(curr).forEach(({ label, value }) => {
      const fineBtn = document.createElement("button");
      fineBtn.textContent = label;
      fineBtn.onclick = () => {
        speedPixelsPerSecond = value;
        currentSpeedIndex = -1; // no main button active
        highlightButton(fineBtn);
      };
      controls.appendChild(fineBtn);
    });

    const btnNext = document.createElement("button");
    btnNext.textContent = `${next + 1}x`;
    btnNext.onclick = () => handleSpeedClick(next);
    controls.appendChild(btnNext);
  }
}

// --- Handle Main Button Click ---
function handleSpeedClick(index) {
  if (index === speedTable.length - 1) {
    // Last button: select directly
    expandedIndex = null;
    speedPixelsPerSecond = speedTable[index];
  } else if (expandedIndex === index) {
    // Collapse
    expandedIndex = null;
  } else {
    // Expand
    expandedIndex = index;
    speedPixelsPerSecond = speedTable[index];
  }
  currentSpeedIndex = index;
  buildButtons();
}

// --- Fine Speeds (0.2x increments) ---
function generateFinerButtons(index) {
  const currSpeed = speedTable[index];
  const nextSpeed = speedTable[index + 1];
  const fineSpeeds = [];

  for (let i = 1; i < 5; i++) {
    const fraction = i * 0.2; // 0.2, 0.4, 0.6, 0.8
    const label = `${(index + 1 + fraction).toFixed(1)}x`;
    
    // Interpolate speed linearly
    const value = currSpeed + (nextSpeed - currSpeed) * fraction;

    fineSpeeds.push({ label, value });
  }
  return fineSpeeds;
}

// --- Highlight Active Button ---
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
      wakeLock.addEventListener('release', () => console.log('Wake Lock released'));
    }
  } catch (err) {
    console.error(err.name, err.message);
  }
}

document.addEventListener('visibilitychange', () => {
  if (wakeLock && document.visibilityState === 'visible') requestWakeLock();
});

// --- Init ---
window.onload = () => {
  buildButtons();
  startAutoScroll();
  requestWakeLock();
};
