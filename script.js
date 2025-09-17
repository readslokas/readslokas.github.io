<div id="controls"></div>

<script>
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
let expandedIndex = null; // which whole number multiplier is expanded
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

  for (let i = 1; i <= maxMultiplier; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i}x`;
    btn.onclick = () => handleSpeedClick(i);
    if (Math.abs(currentMultiplier - i) < 0.001 && expandedIndex === null) {
      btn.classList.add("active");
    }
    controls.appendChild(btn);

    // If this button is expanded (and not the last one), insert fine buttons after it
    if (expandedIndex === i && i < maxMultiplier) {
      const finerButtons = generateFinerButtons(i);
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
    }
  }
}

function handleSpeedClick(multiplier) {
  if (multiplier === maxMultiplier) {
    // Last button: just select it, no expansion
    expandedIndex = null;
    speedPixelsPerSecond = getSpeedForMultiplier(multiplier);
  } else if (expandedIndex === multiplier) {
    expandedIndex = null; // collapse if already expanded
  } else {
    expandedIndex = multiplier; // expand this one
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
</script>
