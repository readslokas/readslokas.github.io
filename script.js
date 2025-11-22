// --- Speed Table Setup ---

let speedTable = [
  20,   // 1.2x
  40,   // 1.4x
  60,   // 1.6x
  80,   // 1.8x
  100,  // 2.0x
  120,  // 2.2x
  140,  // 2.4x
  160,  // 2.6x
  180,  // 2.8x
  200,  // 3.0x
  220,  // 3.2x
  240,  // 3.4x
  260,  // 3.6x
  280,  // 3.8x
  300,  // 4.0x
  320,  // 4.2x
  340,  // 4.4x
  360,  // 4.6x
  380,  // 4.8x
  400,  // 5.0x
  420,  // 5.2x
  440,  // 5.4x
  460,  // 5.6x
  480,  // 5.8x
  500,  // 6.0x
  520,  // 6.2x
  540,  // 6.4x
  560,  // 6.6x
  580,  // 6.8x
  600   // 7.0x
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
      btn.textContent = `${(i + 1) * 0.2 + 1.0}x`;  // Display 1.2x, 1.4x, ..., 7.0x
      btn.onclick = () => handleSpeedClick(i);
      if (i === currentSpeedIndex) btn.classList.add("active");
      controls.appendChild(btn);
    }
    return;
  }

  // Expanded view for non-last buttons
  const prev = expandedIndex - 1;
  const curr = expandedIndex;
  const next = expandedIndex + 1;

  if (prev >= 0) {
    const btnPrev = document.createElement("button");
    btnPrev.textContent = `${(prev + 1) * 0.2 + 1.0}x`;
    btnPrev.onclick = () => handleSpeedClick(prev);
    controls.appendChild(btnPrev);
  }

  const btnCurr = document.createElement("button");
  btnCurr.textContent = `${(curr + 1) * 0.2 + 1.0}x`;
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
    btnNext.textContent = `${(next + 1) * 0.2 + 1.0}x`;
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
    expandedIndex = null;
  } else {
    expandedIndex = index;
    speedPixelsPerSecond = speedTable[index];
  }
  currentSpeedIndex = index;
  buildButtons();
}

// --- Fine Speed Calculation (fixed with interpolation) ---

function generateFinerButtons(index) {
  const fineSpeeds = [];
  const currSpeed = speedTable[index];
  const nextSpeed = speedTable[index + 1];

  for (let i = 1; i < 5; i++) {
    const step = i * 0.2; // 0.2x increments
    const xValue = index + 1 + step; // e.g. 3.2, 3.4, etc.
    const label = `${xValue.toFixed(1)}x`;

    // Linear interpolation between current and next speed
    const fraction = step; // 0.2, 0.4, 0.6, 0.8
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
