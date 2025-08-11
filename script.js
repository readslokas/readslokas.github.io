let speedTable = [10, 30, 55, 80, 90, 96, 100]; // Speeds for 1x - 7x
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
  const allButtons = [];

  // Generate base buttons (1x to 7x)
  for (let i = 0; i < speedTable.length; i++) {
    const label = `${i + 1}x`;
    allButtons.push({ label, value: speedTable[i], isMain: true });

    // Generate finer steps between current and next
    if (i < speedTable.length - 1) {
      const finer = generateFinerSpeeds(i, i + 1);
      allButtons.push(...finer);
    }
  }

  // Determine selected index
  let index = allButtons.findIndex(btn => btn.label === selectedLabel);

  if (index === -1) {
    index = 0;
    selectedLabel = allButtons[0].label;
    speedPixelsPerSecond = allButtons[0].value;
  }

  // Pick 7 buttons centered around the selected one
  const start = Math.max(0, Math.min(index - 3, allButtons.length - 7));
  buttons = allButtons.slice(start, start + 7);

  // Render buttons
  buttons.forEach(btn => {
    const button = document.createElement("button");
    button.textContent = btn.label;
    button.className = (btn.label === selectedLabel) ? "active" : "";
    button.onclick = () => {
      speedPixelsPerSecond = btn.value;
      selectedLabel = btn.label;
      currentSpeedIndex = btn.isMain ? parseInt(btn.label) - 1 : -1;
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
