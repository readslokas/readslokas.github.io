// --- Speed Table Setup ---

let speedTable = [
  0.5,    // 1.0x
  8.0,    // 1.2x
  12.0,   // 1.4x
  16.0,   // 1.6x
  20.0,   // 1.8x
  24.0,   // 2.0x
  28.0,   // 2.2x
  32.0,   // 2.4x
  36.0,   // 2.6x
  40.0,   // 2.8x
  44.0,   // 3.0x
  48.0,   // 3.2x
  52.0,   // 3.4x
  58.5,   // 3.6x
  65.4,   // 3.8x
  72.2,   // 4.0x
  78.0,   // 4.2x
  84.0,   // 4.4x
  111.2,  // 4.6x
  124.2,  // 4.8x
  137.2,  // 5.0x
  161.9,  // 5.2x
  186.6,  // 5.4x
  211.3,  // 5.6x
  235.9,  // 5.8x
  260.6,  // 6.0x
  307.6,  // 6.2x
  354.5,  // 6.4x
  401.4,  // 6.6x
  448.3,  // 6.8x
  495.2   // 7.0x
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

  // Only show whole-number buttons initially: 1x, 2x, ..., 7x
  const wholeNumbers = [0, 5, 10, 15, 20, 25, 30]; // indices for 1x,2x,...7x
  wholeNumbers.forEach(i => {
    const btn = document.createElement("button");
    const multiplier = (1 + i * 0.2).toFixed(0); // show whole number
    btn.textContent = `${multiplier}x`;
    btn.onclick = () => handleSpeedClick(i);
    if (i === currentSpeedIndex) btn.classList.add("active");
    controls.appendChild(btn);
  });

  // If a button is expanded, show fine steps only between clicked and next whole number
  if (expandedIndex !== null && expandedIndex < speedTable.length - 1) {
    const finerButtons = generateFinerButtons(expandedIndex);
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
  }
}

function handleSpeedClick(index) {
  if (index === speedTable.length - 1) {
    // Last button: select only, no expansion
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

// --- Fine Speed Calculation (linear interpolation between clicked and next whole-number) ---

function generateFinerButtons(index) {
  const fineSpeeds = [];
  
  // Find next whole-number index
  const nextWholeIndex = index + 5; 
  const currSpeed = speedTable[index];
  const nextSpeed = speedTable[nextWholeIndex];

  for (let i = 1; i < 5; i++) {
    const step = i * 0.2; // 0.2 increments
    const xValue = (1 + index * 0.2 + step).toFixed(1);
    const fraction = step / 1; // fraction between current and next whole number
    const interpolatedValue = currSpeed + (nextSpeed - currSpeed) * fraction;
    fineSpeeds.push({ label: `${xValue}x`, value: interpolatedValue });
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
  requestWakeLock();
};
