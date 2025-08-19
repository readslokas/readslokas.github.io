let speedTable = [1, 2, 3, 4, 5, 6];
let currentSpeed = 1;
let speedPixelsPerSecond = 5; // Very slow base
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

  if (expandedIndex === null) {
    // Normal buttons
    for (let i = 0; i < speedTable.length; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${speedTable[i]}x`;
      btn.onclick = () => handleSpeedClick(i);
      if (speedTable[i] === currentSpeed) btn.classList.add("active");
      controls.appendChild(btn);
    }
  } else {
    // Expanded view around one speed
    const curr = expandedIndex;
    const prev = curr - 1;
    const next = curr + 1;

    if (prev >= 0) {
      const btnPrev = document.createElement("button");
      btnPrev.textContent = `${speedTable[prev]}x`;
      btnPrev.onclick = () => handleSpeedClick(prev);
      controls.appendChild(btnPrev);
    }

    const btnCurr = document.createElement("button");
    btnCurr.textContent = `${speedTable[curr]}x`;
    btnCurr.classList.add("active");
    btnCurr.onclick = () => handleSpeedClick(curr);
    controls.appendChild(btnCurr);

    // Add finer buttons
    const finerButtons = generateFinerButtons(speedTable[curr], speedTable[next]);
    finerButtons.forEach(({ label, value }) => {
      const fineBtn = document.createElement("button");
      fineBtn.textContent = label;
      fineBtn.onclick = () => {
        currentSpeed = parseFloat(label);
        speedPixelsPerSecond = value;
        highlightButton(fineBtn);

        // Insert a new finer button if clicked
        insertDynamicFiner(label, value, curr, next);
      };
      if (parseFloat(label) === currentSpeed) fineBtn.classList.add("active");
      controls.appendChild(fineBtn);
    });

    if (next < speedTable.length) {
      const btnNext = document.createElement("button");
      btnNext.textContent = `${speedTable[next]}x`;
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
    currentSpeed = speedTable[index];
    speedPixelsPerSecond = currentSpeed * 50; // adjust multiplier
  }
  buildButtons();
}

function generateFinerButtons(start, end) {
  const labels = ["0.2", "0.4", "0.6", "0.8"];
  const fineSpeeds = [];

  labels.forEach((step) => {
    const fraction = parseFloat(step);
    const label = `${(start + fraction).toFixed(1)}x`;
    const interpolatedValue = start * 50 + ((end * 50 - start * 50) * fraction);
    fineSpeeds.push({ label, value: interpolatedValue });
  });

  return fineSpeeds;
}

function insertDynamicFiner(label, value, curr, next) {
  // Remove the previous full integer (like 2x or 3x) to make space
  const controls = document.getElementById("controls");
  const buttons = Array.from(controls.querySelectorAll("button"));

  buttons.forEach((btn) => {
    if (btn.textContent === `${speedTable[curr]}x`) {
      btn.remove();
    }
  });

  // Insert a new finer button between current clicked and the next
  const idx = buttons.findIndex(b => b.textContent === `${speedTable[next]}x`);
  const newBtn = document.createElement("button");
  newBtn.textContent = `${parseFloat(label) + 0.1}x`;
  newBtn.onclick = () => {
    currentSpeed = parseFloat(newBtn.textContent);
    speedPixelsPerSecond = value + 5;
    highlightButton(newBtn);
  };
  controls.insertBefore(newBtn, buttons[idx]);
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
      wakeLock.addEventListener('release', () => console.log('Wake Lock released'));
    }
  } catch (err) {
    console.error(err);
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