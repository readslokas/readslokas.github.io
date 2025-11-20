// --- Speed Table Setup ---

const baseSpeed = 20;       // speed for 1.2x in px/s
const growthFactor = 1.9;   // exponential growth for whole numbers
const wholeLevels = 7;      // 1x through 7x
const fractionalSteps = 4;  // number of fractional steps between whole numbers

let speedTable = [0.5]; // 1x = 0.5 px/s

// Build whole-number speeds 1.2x → 7x
for (let i = 0; i < wholeLevels; i++) {
  let value = baseSpeed * Math.pow(growthFactor, i);
  speedTable.push(value);
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

  // If no button expanded or last button, show all whole-number buttons
  if (expandedIndex === null || expandedIndex === speedTable.length - 1) {
    for (let i = 0; i < speedTable.length; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${i + 1}x`;
      btn.onclick = () => handleSpeedClick(i);
      if (i === currentSpeedIndex) btn.classList.add("active");
      controls.appendChild(btn);
    }
    return;
  }

  // Expanded view: show previous, current, next + finer buttons
  const prev = expandedIndex - 1;
  const curr = expandedIndex;
  const next = expandedIndex + 1;

  if (prev >= 0) {
    const btnPrev = document.createElement("button");
    btnPrev.textContent = `${prev + 1}x`;
    btnPrev.onclick = () => handleSpeedClick(prev);
    controls.appendChild(btnPrev);
  }

  const btnCurr = document.createElement("button");
  btnCurr.textContent = `${curr + 1}x`;
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
        currentSpeedIndex = -1; // fractional
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

function handleSpeedClick(index) {
  if (index === speedTable.length - 1) {
    // Last button: just select it, no expansion
    expandedIndex = null;
    speedPixelsPerSecond = speedTable[index];
  } else if (expandedIndex === index) {
    // Collapse if same button clicked
    expandedIndex = null;
  } else {
    expandedIndex = index;
    speedPixelsPerSecond = speedTable[index];
  }
  currentSpeedIndex = index;
  buildButtons();
}

// --- Fine Speed Calculation ---
function generateFinerButtons(index) {
  const fineSpeeds = [];
  const currSpeed = speedTable[index];
  const nextSpeed = speedTable[index + 1];

  // Exponential interpolation for fractional speeds
  for (let i = 1; i < fractionalSteps; i++) {
    const step = i / fractionalSteps; // 0.25, 0.5, 0.75
    const label = `${(index + 1 + step).toFixed(1)}x`;
    const interpolatedValue = currSpeed * Math.pow(nextSpeed / currSpeed, step);
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
