let speedTable = [1, 2, 3, 4, 5, 6];
let currentSpeed = 1;
let speedPixelsPerSecond = 5;
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null;
let finerMap = {}; // stores finer buttons per integer speed
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
    speedTable.forEach((val, i) => {
      const btn = document.createElement("button");
      btn.textContent = `${val}x`;
      btn.onclick = () => handleSpeedClick(i);
      if (val === currentSpeed) btn.classList.add("active");
      controls.appendChild(btn);
    });
  } else {
    // Expanded view
    const curr = expandedIndex;
    const prev = curr - 1;
    const next = curr + 1;

    if (prev >= 0) {
      const btnPrev = document.createElement("button");
      btnPrev.textContent = `${speedTable[prev]}x`;
      btnPrev.onclick = () => handleSpeedClick(prev);
      controls.appendChild(btnPrev);
    }

    // remove the integer button once finer expansion is chosen
    if (!finerMap[speedTable[curr]]) {
      finerMap[speedTable[curr]] = generateFinerButtons(speedTable[curr], speedTable[next]);
    }

    finerMap[speedTable[curr]].forEach(({ label, value }) => {
      const fineBtn = document.createElement("button");
      fineBtn.textContent = label;
      fineBtn.onclick = () => {
        currentSpeed = parseFloat(label);
        speedPixelsPerSecond = value;
        highlightButton(fineBtn);

        // when a finer button is clicked, insert the next one in sequence
        insertNextFiner(speedTable[curr], label, value, next);
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
    speedPixelsPerSecond = currentSpeed * 50;
  }
  buildButtons();
}

function generateFinerButtons(start, end) {
  const labels = ["0.2", "0.4", "0.6", "0.8"];
  return labels.map(step => {
    const fraction = parseFloat(step);
    const label = `${(start + fraction).toFixed(1)}x`;
    const interpolatedValue = start * 50 + ((end * 50 - start * 50) * fraction);
    return { label, value: interpolatedValue };
  });
}

function insertNextFiner(base, label, value, nextIndex) {
  const num = parseFloat(label);
  const step = 0.1;
  const nextFine = (num + step).toFixed(1);

  // Avoid duplicates
  if (!finerMap[base].some(b => b.label === `${nextFine}x`) && num + step < speedTable[nextIndex]) {
    finerMap[base].push({
      label: `${nextFine}x`,
      value: value + 5
    });
    // keep order
    finerMap[base].sort((a, b) => parseFloat(a.label) - parseFloat(b.label));
    buildButtons();
  }
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
