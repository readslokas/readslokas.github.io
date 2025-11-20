// --- Speed Table Setup ---

const minSpeed = 0.5;   // 1x
const maxSpeed = 500;   // 7x
const step = 0.2;       // fractional step
const maxMultiplier = 7;

let speedTable = [];
for (let x = 1; x <= maxMultiplier; x += step) {
  const t = (x - 1) / (maxMultiplier - 1); // normalize 0→1
  const speed = minSpeed * Math.pow(maxSpeed / minSpeed, t);
  speedTable.push({ label: `${x.toFixed(1)}x`, value: speed });
}

// --- State ---
let currentSpeedIndex = 0;
let speedPixelsPerSecond = speedTable[0].value;
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

  const wholeIndices = [];
  for (let i = 0; i < speedTable.length; i++) {
    if (Math.abs((i * step) % 1) < 0.01) wholeIndices.push(i);
  }

  wholeIndices.forEach(idx => {
    const btn = document.createElement("button");
    btn.textContent = speedTable[idx].label;
    btn.onclick = () => handleSpeedClick(idx);
    if (idx === currentSpeedIndex) btn.classList.add("active");
    controls.appendChild(btn);
  });

  if (expandedIndex !== null && expandedIndex < speedTable.length - 1) {
    const nextWhole = wholeIndices.find(i => i > expandedIndex);
    const end = nextWhole || speedTable.length - 1;

    for (let i = expandedIndex + 1; i < end; i++) {
      const s = speedTable[i];
      const fineBtn = document.createElement("button");
      fineBtn.textContent = s.label;
      fineBtn.onclick = () => {
        speedPixelsPerSecond = s.value;
        currentSpeedIndex = i;
        highlightButton(fineBtn);
      };
      controls.appendChild(fineBtn);
    }
  }
}

function handleSpeedClick(index) {
  if (expandedIndex === index) {
    expandedIndex = null;
  } else {
    expandedIndex = index;
    speedPixelsPerSecond = speedTable[index].value;
  }
  currentSpeedIndex = index;
  buildButtons();
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
    }
  } catch (err) { console.error(err); }
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
