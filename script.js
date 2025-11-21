// --- Speed Table Setup (Rewritten Incremental Logic) ---

// Define the set of 'x' multipliers that the main buttons represent (1x, 1.2x, 2x, 3x... 7x).
const speedMultipliers = [1, 1.2, 2, 3, 4, 5, 6, 7];

const baseSpeedPx = 0.5;    // Speed for 1x
const base1_2xSpeed = 20;   // Specific speed for 1.2x (start of the main range)
const incrementalStep = 5;  // The step size in px/s for speeds 2x and above

let speedTable = [baseSpeedPx]; // Index 0: 1x = 0.5 px/s

// Calculate the remaining speeds (1.2x, 2x, 3x, 4x, 5x, 6x, 7x)
for (let i = 1; i < speedMultipliers.length; i++) {
  let value;
  if (i === 1) {
    // Index 1 is 1.2x, using the base1_2xSpeed
    value = base1_2xSpeed;
  } else {
    // Speeds 2x through 7x (i=2 to i=7) are incremental:
    // 2x (i=2): 20 + 5 * (2 - 1) = 25 px/s
    // 7x (i=7): 20 + 5 * (7 - 1) = 50 px/s
    value = base1_2xSpeed + incrementalStep * (i - 1);
  }
  speedTable.push(value);
}

// speedTable is now: [0.5, 20, 25, 30, 35, 40, 45, 50] px/s

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

// --- UI Buttons (Updated Labeling) ---

// Helper function to get the correct label based on index
function getButtonLabel(index) {
    if (index === 0) return "1x";
    if (index === 1) return "1.2x";
    return `${index}x`;
}

function buildButtons() {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";

  // Special case: last index (7x) should never collapse
  if (expandedIndex === null || expandedIndex === speedTable.length - 1) {
    for (let i = 0; i < speedTable.length; i++) {
      const btn = document.createElement("button");
      btn.textContent = getButtonLabel(i + 1); // Use i+1 for the multiplier
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
    btnPrev.textContent = getButtonLabel(prev + 1);
    btnPrev.onclick = () => handleSpeedClick(prev);
    controls.appendChild(btnPrev);
  }

  const btnCurr = document.createElement("button");
  btnCurr.textContent = getButtonLabel(curr + 1);
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
    btnNext.textContent = getButtonLabel(next + 1);
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

// --- Fine Speed Calculation (Using new speed values) ---

function generateFinerButtons(index) {
  const fineSpeeds = [];
  const currSpeed = speedTable[index];
  const nextSpeed = speedTable[index + 1];
  const currMultiplier = speedMultipliers[index];

  for (let i = 1; i < 5; i++) {
    const fraction = i * 0.2; // 0.2, 0.4, 0.6, 0.8 steps for interpolation

    // Label calculation must account for multiplier differences (e.g., 1x to 1.2x is 0.2 difference)
    // and 1.2x to 2x is 0.8 difference.
    let xValue;
    if (index === 0) { // Between 1x (1.0) and 1.2x
        // Interpolate the multiplier: 1.0 + (1.2 - 1.0) * fraction
        xValue = currMultiplier + (0.2) * fraction; 
    } else if (index === 1) { // Between 1.2x and 2x
        // Interpolate the multiplier: 1.2 + (2.0 - 1.2) * fraction
        xValue = currMultiplier + (0.8) * fraction;
    } else { // Between 2x and 3x, 3x and 4x, etc. (Difference is 1.0)
        // Interpolate the multiplier: e.g., 2.0 + (3.0 - 2.0) * fraction -> 2.2, 2.4, 2.6, 2.8
        xValue = currMultiplier + (1.0) * fraction;
    }
    
    const label = `${xValue.toFixed(1)}x`;

    // Linear interpolation of the actual px/s speed values
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
  // Assuming a div with id="controls" exists for the buttons
  // and that the body/container is ready for scrolling.
  buildButtons();
  startAutoScroll();
  requestWakeLock(); // Prevent screen from sleeping
};