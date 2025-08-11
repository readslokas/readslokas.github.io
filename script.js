let speedTable = [10, 30, 55, 80, 90, 96, 100]; // main speeds (1x..7x)
let speedLabels = speedTable.map((_, i) => `${i + 1}x`);
let currentSpeedIndex = 0;
let speedPixelsPerSecond = speedTable[0];
let lastTimestamp = null;
let animationFrameId = null;
let wakeLock = null;

let expandedIndex = null; // null = collapsed whole numbers, else expanded around this index

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

  let buttonsToShow = [];

  if (expandedIndex === null) {
    // Show only whole numbers (1x..7x)
    buttonsToShow = speedTable.map((speed, i) => ({
      label: `${i + 1}x`,
      value: speed,
      index: i,
      isMain: true,
    }));
  } else {
    // Show expanded decimals around expandedIndex with 7 buttons total

    // Collect all buttons: main + finer speeds
    const allButtons = [];

    for (let i = 0; i < speedTable.length; i++) {
      allButtons.push({ label: `${i + 1}x`, value: speedTable[i], index: i, isMain: true });
      if (i < speedTable.length - 1) {
        allButtons.push(...generateFinerSpeeds(i, i + 1));
      }
    }

    // Find index of expandedIndex's main speed in allButtons
    const mainButtonLabel = `${expandedIndex + 1}x`;
    let centerIndex = allButtons.findIndex(btn => btn.label === mainButtonLabel);

    // We want 7 buttons centered on centerIndex (adjust if near start/end)
    let start = Math.max(0, centerIndex - 3);
    if (start + 7 > allButtons.length) start = allButtons.length - 7;
    if (start < 0) start = 0;

    buttonsToShow = allButtons.slice(start, start + 7);
  }

  // Render buttons
  buttonsToShow.forEach(btn => {
    const button = document.createElement("button");
    button.textContent = btn.label;
    if (
      (expandedIndex === null && btn.index === currentSpeedIndex) ||
      (expandedIndex !== null && btn.label === `${expandedIndex + 1}x`) ||
      (btn.value === speedPixelsPerSecond)
    ) {
      button.classList.add("active");
    }

    button.onclick = () => handleButtonClick(btn);
    controls.appendChild(button);
  });
}

function generateFinerSpeeds(index1, index2) {
  const speed1 = speedTable[index1];
  const speed2 = speedTable[index2];
  const finer = [];

  for (let i = 1; i <= 5; i++) {
    const step = 0.2 * i;
    const rawLabel = index1 + 1 + step;
    if (rawLabel >= speedTable.length) break;
    const label = `${rawLabel.toFixed(1)}x`;
    const value = speed1 + ((speed2 - speed1) * step);
    finer.push({ label, value, index: -1, isMain: false });
  }
  return finer;
}

function handleButtonClick(btn) {
  if (btn.isMain) {
    // Clicked a whole number button
    if (expandedIndex === btn.index) {
      // Collapse if clicked same expanded whole number
      expandedIndex = null;
      currentSpeedIndex = btn.index;
      speedPixelsPerSecond = speedTable[btn.index];
    } else {
      // Expand decimals around clicked whole number
      expandedIndex = btn.index;
      currentSpeedIndex = btn.index;
      speedPixelsPerSecond = speedTable[btn.index];
    }
  } else {
    // Clicked a finer decimal button
    speedPixelsPerSecond = btn.value;
    currentSpeedIndex = -1; // no main button selected
  }
  buildButtons();
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock was released');
      });
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
  requestWakeLock();
};
