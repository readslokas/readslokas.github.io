// Define speed table
let speedTable = [0.5]; // 1x = 0.5

// Base speed at 1.2x
let baseSpeed = 20;

// Growth factor (tweak this to change curve steepness)
let growthFactor = 1.4;

// Number of whole-number multipliers (up to 7x here)
let levels = 6;

// Build whole-number speeds
for (let i = 0; i < levels; i++) {
  let factor = Math.pow(growthFactor, i);
  speedTable.push(baseSpeed * factor);
}

let currentSpeedIndex = 0;
let speedPixelsPerSecond = speedTable[0];
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null;
let wakeLock = null;

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

function buildButtons() {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";

  if (expandedIndex === null) {
    for (let i = 0; i < speedTable.length; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${i + 1}x`;
      btn.onclick = () => handleSpeedClick(i);
      if (i === currentSpeedIndex) btn.classList.add("active");
      controls.appendChild(btn);
    }
  } else {
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
          currentSpeedIndex = -1;
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
}

function handleSpeedClick(index) {
  if (expandedIndex === index) {
    expandedIndex = null;
  } else {
    expandedIndex = index;
    speedPixelsPerSecond = speedTable[index];
  }
  currentSpeedIndex = index;
  buildButtons();
}

// Generate fine buttons (2.2x, 2.4x, etc.) using exponential formula directly
function generateFinerButtons(index) {
  const fineSpeeds = [];

  for (let i = 1; i < 5; i++) {
    const step = i * 0.2; // 0.2x increments
    const label = `${(index + 1 + step).toFixed(1)}x`;

    // Compute directly from exponential formula
    const interpolatedValue = baseSpeed * Math.pow(growthFactor, index + step);

    fineSpeeds.push({ label, value: interpolatedValue });
  }

  return fineSpeeds;
}

function highlightButton(activeBtn) {
  document.querySelectorAll("#controls button").forEach(btn => {
    btn.classList.toggle("active", btn === activeBtn);
  });
}

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

window.onload = () => {
  buildButtons();
  startAutoScroll();
  requestWakeLock(); // Prevent screen from sleeping
};