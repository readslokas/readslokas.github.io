let speedTable = [10, 30, 55, 80, 90, 96, 100];
let currentSpeedIndex = 0;
let speedPixelsPerSecond = 0.5;
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null;
let wakeLock = null;
let activeFiner = null;

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
    // Show 7 main buttons
    for (let i = 0; i < speedTable.length; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${i + 1}x`;
      btn.onclick = () => handleSpeedClick(i);
      if (i === currentSpeedIndex) btn.classList.add("active");
      controls.appendChild(btn);
    }
  } else {
    const prev = expandedIndex;
    const next = expandedIndex + 1;

    // Always show previous main button if available
    if (prev > 0) {
      const btnPrev = document.createElement("button");
      btnPrev.textContent = `${prev}x`;
      btnPrev.onclick = () => handleSpeedClick(prev - 1);
      controls.appendChild(btnPrev);
    }

    // Current main button
    const btnCurr = document.createElement("button");
    btnCurr.textContent = `${prev + 1}x`;
    btnCurr.onclick = () => handleSpeedClick(prev);
    if (activeFiner === null) btnCurr.classList.add("active");
    controls.appendChild(btnCurr);

    // Finer buttons between current and next main speed
    const finerButtons = generateFinerButtons(prev, next);
    finerButtons.forEach(({ label, value }, idx) => {
      const fineBtn = document.createElement("button");
      fineBtn.textContent = label;
      fineBtn.onclick = () => handleFinerClick(idx, prev, next, finerButtons);
      if (activeFiner === idx) fineBtn.classList.add("active");
      controls.appendChild(fineBtn);
    });

    // Show next main button
    if (next < speedTable.length) {
      const btnNext = document.createElement("button");
      btnNext.textContent = `${next + 1}x`;
      btnNext.onclick = () => handleSpeedClick(next);
      if (activeFiner === null && currentSpeedIndex === next) btnNext.classList.add("active");
      controls.appendChild(btnNext);
    }
  }
}

function handleSpeedClick(index) {
  // Reset if clicked same main button
  if (expandedIndex === index) {
    expandedIndex = null;
    activeFiner = null;
  } else {
    expandedIndex = index;
    activeFiner = null;
    speedPixelsPerSecond = speedTable[index];
  }
  currentSpeedIndex = index;
  buildButtons();
}

function handleFinerClick(idx, index1, index2, finerButtons) {
  // Update finer active state
  activeFiner = idx;
  speedPixelsPerSecond = finerButtons[idx].value;

  // Dynamically adjust finer buttons
  if (idx < finerButtons.length - 1) {
    // Replace earlier finer with next finer if possible
    finerButtons[idx + 1].label = `${(index1 + 1 + (idx + 2) * 0.1).toFixed(1)}x`;
    finerButtons[idx + 1].value = speedTable[index1] + ((speedTable[index2] - speedTable[index1]) * ((idx + 2) * 0.1));
  }

  buildButtons();
}

function generateFinerButtons(index1, index2) {
  const speed1 = speedTable[index1];
  const speed2 = speedTable[index2];
  const finer = [];
  for (let i = 1; i <= 4; i++) {
    const step = i * 0.2;
    const label = `${(index1 + 1 + step).toFixed(1)}x`;
    const interpolatedValue = speed1 + ((speed2 - speed1) * step);
    finer.push({ label, value: interpolatedValue });
  }
  return finer;
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
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
