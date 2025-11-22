// --- Speed Table Setup ---
let speedTable = [
  0.5,    // 1x
  20,     // 1.2x
  28,     // 1.4x
  36,     // 1.6x
  44,     // 1.8x
  52,     // 2.0x
  60,     // 2.2x
  68,     // 2.4x
  76,     // 2.6x
  84,     // 2.8x
  92,     // 3.0x
  100,    // 3.2x
  108,    // 3.4x
  116,    // 3.6x
  124,    // 3.8x
  132,    // 4.0x
  140,    // 4.2x
  148,    // 4.4x
  156,    // 4.6x
  164,    // 4.8x
  172,    // 5.0x
  180,    // 5.2x
  188,    // 5.4x
  196,    // 5.6x
  204,    // 5.8x
  212,    // 6.0x
  220,    // 6.2x
  228,    // 6.4x
  236,    // 6.6x
  244,    // 6.8x
  252     // 7.0x
];

// --- State ---
let currentSpeedIndex = 0;
let speedPixelsPerSecond = speedTable[0]; // Initial speed is set to 0.5 (for 1x)
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null;  // Tracks expanded major step
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

  // Show major steps (1x, 2x, 3x, ..., 7x) initially
  for (let i = 0; i < 7; i++) {  // Limit to 7 steps
    const btn = document.createElement("button");
    btn.textContent = `${i + 1}x`;
    btn.onclick = () => handleMajorStepClick(i);
    if (i === currentSpeedIndex) btn.classList.add("active");
    controls.appendChild(btn);
  }
}

function handleMajorStepClick(index) {
  if (expandedIndex === index) {
    // If the selected major step is already expanded, collapse it
    expandedIndex = null;
    buildButtons();  // Rebuild major buttons view
  } else {
    // Expand the selected major step to show the substeps
    expandedIndex = index;
    speedPixelsPerSecond = speedTable[index * 5]; // Start at the major step (1x, 2x, etc.)
    buildExpandedButtons(index);
  }
}

function buildExpandedButtons(index) {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";

  // Show major step button (e.g., 1x, 2x, 3x, etc.)
  const majorBtn = document.createElement("button");
  majorBtn.textContent = `${index + 1}x`;
  majorBtn.classList.add("active");
  majorBtn.onclick = () => handleMajorStepClick(index);  // Collapse the view when clicked
  controls.appendChild(majorBtn);

  // Show substeps (e.g., 1.2x, 1.4x, 1.6x, ...) and next major steps
  const startStep = index * 5; // Each major step has 5 substeps (1.2x, 1.4x, etc.)
  const substeps = [];
  for (let i = 1; i < 5; i++) { // We have 4 substeps (e.g., 1.2x, 1.4x, etc.)
    const substepIndex = startStep + i;
    const substepLabel = `${(index + 1 + i * 0.2).toFixed(1)}x`;
    substeps.push({ label: substepLabel, index: substepIndex });
  }

  // Show substeps and next major steps
  substeps.forEach(({ label, index }) => {
    const substepBtn = document.createElement("button");
    substepBtn.textContent = label;
    substepBtn.onclick = () => handleSubstepClick(index);
    if (index === currentSpeedIndex) substepBtn.classList.add("active");
    controls.appendChild(substepBtn);
  });

  // Show the next major step after the substeps
  if (index + 1 < 7) {
    const nextMajorStepBtn = document.createElement("button");
    nextMajorStepBtn.textContent = `${index + 2}x`;
    nextMajorStepBtn.onclick = () => handleMajorStepClick(index + 1);
    controls.appendChild(nextMajorStepBtn);
  }
}

function handleSubstepClick(index) {
  // Select the substep speed
  speedPixelsPerSecond = speedTable[index];
  currentSpeedIndex = index;
  
  // Update the active button to reflect the selected substep
  highlightActiveButton();
}

function highlightActiveButton() {
  // Remove the "active" class from all buttons
  const allButtons = document.querySelectorAll("#controls button");
  allButtons.forEach(btn => {
    btn.classList.remove("active");
  });

  // Add the "active" class to the selected button
  const selectedButton = document.querySelector(`#controls button:nth-child(${currentSpeedIndex + 1})`);
  if (selectedButton) {
    selectedButton.classList.add("active");
  }
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
