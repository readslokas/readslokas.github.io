// --- Speed Table Setup ---

const baseSpeed = 20;       // speed for 1.2x in px/s
const growthFactor = 1.9;   // exponential growth between whole numbers
const totalLevels = 7;      // 1x through 7x
const fractionalSteps = 4;  // number of fractional buttons between whole numbers

let speedTable = [0.5]; // 1x = 0.5 px/s (manual override for 1x)

// Build speed table with smooth fractional increments
for (let i = 1; i < totalLevels; i++) {
  const prevSpeed = i === 1 ? baseSpeed : speedTable[i - 1];
  const nextSpeed = baseSpeed * Math.pow(growthFactor, i - 1);

  // Whole number speed
  speedTable.push(nextSpeed);

  // Fractional speeds (e.g., 1.2x, 1.4x, etc.)
  for (let j = 1; j < fractionalSteps; j++) {
    const step = j / fractionalSteps;
    const interpolated = nextSpeed * Math.pow(speedTable[i] / nextSpeed, step);
    speedTable.push(interpolated);
  }
}

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

  for (let i = 0; i < speedTable.length; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${(i + 1) / 1}x`; // approximate label; can adjust
    btn.onclick = () => handleSpeedClick(i);
    if (i === currentSpeedIndex) btn.classList.add("active");
    controls.appendChild(btn);
  }
}

function handleSpeedClick(index) {
  speedPixelsPerSecond = speedTable[index];
  currentSpeedIndex = index;
  buildButtons();
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
