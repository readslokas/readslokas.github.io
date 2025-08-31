const baseSpeed = 20; // starting speed in pixels per second
const baseLabel = 1.2; // starting label multiplier for buttons

// Define percent increases per step — smaller increments as speed gets faster
const percentIncreaseTable = [36, 30, 25, 20, 15, 10, 5]; 

// Build speedTable dynamically from percentIncreaseTable
let speedTable = [];
let currentSpeed = baseSpeed;
speedTable.push(currentSpeed);

for (let i = 0; i < percentIncreaseTable.length; i++) {
  currentSpeed = currentSpeed * (1 + percentIncreaseTable[i] / 100);
  speedTable.push(currentSpeed);
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

  const totalButtons = speedTable.length;

  if (expandedIndex === null) {
    for (let i = 0; i < totalButtons; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${(baseLabel + i).toFixed(1)}x`;
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
      btnPrev.textContent = `${(baseLabel + prev).toFixed(1)}x`;
      btnPrev.onclick = () => handleSpeedClick(prev);
      controls.appendChild(btnPrev);
    }

    const btnCurr = document.createElement("button");
    btnCurr.textContent = `${(baseLabel + curr).toFixed(1)}x`;
    btnCurr.classList.add("active");
    btnCurr.onclick = () => handleSpeedClick(curr);
    controls.appendChild(btnCurr);

    if (next < totalButtons) {
      const finerButtons = generateFinerButtons(curr, next);
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
      btnNext.textContent = `${(baseLabel + next).toFixed(1)}x`;
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

function generateFinerButtons(index1, index2) {
  const speed1 = speedTable[index1];
  const speed2 = speedTable[index2];
  const labels = ["0.2x", "0.4x", "0.6x", "0.8x"];
  const fineSpeeds = [];

  labels.forEach((label, i) => {
    const step = (i + 1) * 0.2;
    const fullLabel = `${(baseLabel + index1 + step).toFixed(1)}x`;
    const interpolatedValue = speed1 + ((speed2 - speed1) * step);
    fineSpeeds.push({ label: fullLabel, value: interpolatedValue });
  });

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
