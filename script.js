let speedTable = [10, 30, 55, 80, 90, 96, 100]; // 1x to 7x
let currentSpeedIndex = 0;
let speedPixelsPerSecond = speedTable[0];
let lastTimestamp = null;
let animationFrameId = null;
let wakeLock = null;
let selectedLabel = "1x";

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

  const allButtons = [];

  // Build all buttons: main + finer
  for (let i = 0; i < speedTable.length; i++) {
    allButtons.push({ label: `${i + 1}x`, value: speedTable[i], isMain: true });

    if (i < speedTable.length - 1) {
      const finer = generateFinerSpeeds(i, i + 1);
      allButtons.push(...finer);
    }
  }

  let selectedIndex = allButtons.findIndex(btn => btn.label === selectedLabel);
  if (selectedIndex === -1) selectedIndex = 0;

  const start = Math.max(0, Math.min(selectedIndex - 3, allButtons.length - 7));
  const visibleButtons = allButtons.slice(start, start + 7);

  visibleButtons.forEach(btn => {
    const button = document.createElement("button");
    button.textContent = btn.label;
    if (btn.label === selectedLabel) button.classList.add("active");
    button.onclick = () => {
      speedPixelsPerSecond = btn.value;
      selectedLabel = btn.label;
      buildButtons();
    };
    controls.appendChild(button);
  });
}

function generateFinerSpeeds(index1, index2) {
  const speed1 = speedTable[index1];
  const speed2 = speedTable[index2];
  const finer = [];

  for (let i = 1; i <= 5; i++) {
    const step = 0.2 * i;
    const label = `${(index1 + 1 + step).toFixed(1)}x`;
    const value = speed1 + ((speed2 - speed1) * step);
    finer.push({ label, value, isMain: false });
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
