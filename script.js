let speedTable = [10, 30, 55, 80, 90, 96, 100]; // 1x - 7x
let speedPixelsPerSecond = speedTable[0];
let currentSpeedIndex = 0;
let lastTimestamp = null;
let animationFrameId = null;
let wakeLock = null;
let selectedLabel = null;

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

  let buttons = [];

  if (!selectedLabel) {
    // Default: show 1x to 7x
    for (let i = 0; i < speedTable.length; i++) {
      const label = `${i + 1}x`;
      buttons.push({ label, value: speedTable[i], isMain: true });
    }
  } else if (selectedLabel.includes(".")) {
    // Finer speed clicked
    const value = parseFloat(selectedLabel);
    const mainIndex = Math.floor(value - 1);
    const finer = generateFinerSpeeds(mainIndex, mainIndex + 1);
    const selectedIndex = finer.findIndex(f => f.label === selectedLabel);

    const slice = finer.slice(Math.max(0, selectedIndex - 2), selectedIndex + 3);

    if (mainIndex >= 0) {
      buttons.push({ label: `${mainIndex + 1}x`, value: speedTable[mainIndex], isMain: true });
    }
    buttons = buttons.concat(slice);
    if (mainIndex + 1 < speedTable.length) {
      buttons.push({ label: `${mainIndex + 2}x`, value: speedTable[mainIndex + 1], isMain: true });
    }

  } else {
    // Main speed clicked
    const index = parseInt(selectedLabel);
    const finer = generateFinerSpeeds(index, index + 1);
    buttons.push({ label: `${index + 1}x`, value: speedTable[index], isMain: true });
    buttons = buttons.concat(finer);
    if (index + 1 < speedTable.length) {
      buttons.push({ label: `${index + 2}x`, value: speedTable[index + 1], isMain: true });
    }
    if (index > 0) {
      buttons.unshift({ label: `${index}x`, value: speedTable[index - 1], isMain: true });
    }
  }

  // Limit to 7 buttons max
  buttons = buttons.slice(0, 7);

  // Render buttons
  buttons.forEach(btn => {
    const button = document.createElement("button");
    button.textContent = btn.label;
    button.className = (btn.label === selectedLabel || btn.label === `${currentSpeedIndex + 1}x`) ? "active" : "";
    button.onclick = () => {
      speedPixelsPerSecond = btn.value;
      if (btn.isMain) {
        currentSpeedIndex = parseInt(btn.label) - 1;
        selectedLabel = `${currentSpeedIndex}`;
      } else {
        selectedLabel = btn.label;
        currentSpeedIndex = -1;
      }
      buildButtons();
    };
    controls.appendChild(button);
  });
}

function generateFinerSpeeds(index1, index2) {
  if (index2 >= speedTable.length) return [];
  const speed1 = speedTable[index1];
  const speed2 = speedTable[index2];
  const finer = [];
  for (let i = 1; i <= 5; i++) {
    const step = 0.2 * i;
    const label = `${(index1 + 1 + step).toFixed(1)}x`;
    const value = speed1 + ((speed2 - speed1) * step);
    finer.push({ label, value });
  }
  return finer;
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
