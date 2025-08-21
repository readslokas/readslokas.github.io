let currentSpeedIndex = 0;
let speedPixelsPerSecond = 0.5; // 1x baseline
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null;
let wakeLock = null;

// ---- Exponential Speed Curve ----
function generateSpeedTable(steps = 7, min = 10, max = 100) {
  let table = [];
  for (let i = 0; i < steps; i++) {
    let t = i / (steps - 1);
    let value = min * Math.pow(max / min, t);
    table.push(Math.round(value));
  }
  return table;
}

// 1x–7x major speeds
let speedTable = generateSpeedTable();

// ---- Finer Buttons with Exponential Interpolation ----
function generateFinerButtons(index1, index2) {
  const speed1 = speedTable[index1];
  const speed2 = speedTable[index2];
  const steps = [0.2, 0.4, 0.6, 0.8]; // fractional multipliers between index1+1 → index2+1

  return steps.map(step => {
    const multiplier = (index1 + 1) + step;   // e.g. 2 + 0.2 = 2.2
    const label = `${multiplier.toFixed(1)}x`;
    // exponential interpolation instead of linear
    const interpolatedValue = speed1 * Math.pow(speed2 / speed1, step);
    return { label, value: interpolatedValue };
  });
}

// ---- Core Scrolling ----
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

// ---- UI Controls ----
function buildButtons() {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";

  if (expandedIndex === null) {
    for (let i = 0; i < speedTable.length; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${i + 1}x`;
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
      btnPrev.textContent = `${prev + 1}x`;
      btnPrev.onclick = () => handleSpeedClick(prev);
      controls.appendChild(btnPrev);
    }

    const btnCurr = document.createElement("button");
    btnCurr.textContent = `${curr + 1}x`;
    btnCurr.classList.add("active");
    btnCurr.onclick = () => handleSpeedClick(curr);
    controls.appendChild(btnCurr);

    if (next < speedTable.length) {
      // finer buttons for every pair (curr → next)
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
      btnNext.textContent = `${next + 1}x`;
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
    if (index === 0) {
      speedPixelsPerSecond = 0.5; // baseline
    } else {
      speedPixelsPerSecond = speedTable[index];
    }
  }
  currentSpeedIndex = index;
  buildButtons();
}

function highlightButton(activeBtn) {
  document.querySelectorAll("#controls button").forEach(btn => {
    btn.classList.toggle("active", btn === activeBtn);
  });
}

// ---- Wake Lock ----
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
  requestWakeLock();
};