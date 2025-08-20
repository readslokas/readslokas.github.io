let speedTable = [10, 30, 55, 80, 90, 96, 100];
let currentSpeedIndex = 0;
let speedPixelsPerSecond = 0.5;
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null;
let wakeLock = null;

// Store dynamically generated finer speeds between main speeds
let dynamicFinerSpeeds = {}; // Example: { "1-2": [ {label: "2.2x", value: 22}, ... ] }

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
    // Show only main speed buttons
    for (let i = 0; i < speedTable.length; i++) {
      const btn = createButton(`${i + 1}x`, () => handleSpeedClick(i));
      if (i === currentSpeedIndex) btn.classList.add("active");
      controls.appendChild(btn);
    }
  } else {
    const prev = expandedIndex - 1;
    const curr = expandedIndex;
    const next = expandedIndex + 1;

    // Add previous main speed button
    if (prev >= 0) {
      const btnPrev = createButton(`${prev + 1}x`, () => handleSpeedClick(prev));
      controls.appendChild(btnPrev);
    }

    // Add current main speed button
    const btnCurr = createButton(`${curr + 1}x`, () => handleSpeedClick(curr));
    btnCurr.classList.add("active");
    controls.appendChild(btnCurr);

    // Add finer buttons between current and next
    if (next < speedTable.length) {
      const finerButtons = generateFinerButtons(curr, next);
      finerButtons.forEach(({ label, value }) => {
        const fineBtn = createButton(label, () => handleFinerClick(curr, next, label, value));
        if (Math.abs(value - speedPixelsPerSecond) < 0.01) fineBtn.classList.add("active");
        controls.appendChild(fineBtn);
      });

      // Add next main speed button
      const btnNext = createButton(`${next + 1}x`, () => handleSpeedClick(next));
      controls.appendChild(btnNext);
    }
  }
}

function createButton(label, onClick) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.onclick = onClick;
  return btn;
}

function handleSpeedClick(index) {
  if (expandedIndex === index) {
    // Collapse back to main speeds only
    expandedIndex = null;
  } else {
    // Expand around this main speed
    expandedIndex = index;
    speedPixelsPerSecond = index === 0 ? 0.5 : speedTable[index];
  }
  currentSpeedIndex = index;
  buildButtons();
}

function handleFinerClick(index1, index2, label, value) {
  speedPixelsPerSecond = value;
  currentSpeedIndex = -1;

  const clicked = parseFloat(label);
  const finerArray = dynamicFinerSpeeds[`${index1}-${index2}`] || [];

  // Find where clicked finer is in the list
  const clickedIndex = finerArray.findIndex(f => parseFloat(f.label) === clicked);

  // Add a new finer speed only if there’s space between clicked and its next neighbor
  if (clickedIndex !== -1 && clickedIndex < finerArray.length - 1) {
    const nextLabel = parseFloat(finerArray[clickedIndex + 1].label);
    const gap = nextLabel - clicked;

    // Only insert midpoint if gap is still > 0.1 (prevent duplicates)
    if (gap > 0.1) {
      const mid = clicked + gap / 2;
      const speed1 = speedTable[index1];
      const speed2 = speedTable[index2];
      const midValue = speed1 + ((speed2 - speed1) * ((mid - (index1 + 1)) / ((index2 - index1))));
      finerArray.splice(clickedIndex + 1, 0, {
        label: `${mid.toFixed(1)}x`,
        value: midValue
      });
    }
  }

  dynamicFinerSpeeds[`${index1}-${index2}`] = finerArray;
  highlightButton(label);
  buildButtons();
}

function generateFinerButtons(index1, index2) {
  const key = `${index1}-${index2}`;
  if (!dynamicFinerSpeeds[key]) {
    // Initialize with 4 fixed finer buttons: .2, .4, .6, .8
    const speed1 = speedTable[index1];
    const speed2 = speedTable[index2];
    dynamicFinerSpeeds[key] = [0.2, 0.4, 0.6, 0.8].map(step => {
      const label = `${(index1 + 1 + step).toFixed(1)}x`;
      const value = speed1 + ((speed2 - speed1) * step);
      return { label, value };
    });
  }
  return dynamicFinerSpeeds[key];
}

function highlightButton(label) {
  document.querySelectorAll("#controls button").forEach(btn => {
    btn.classList.toggle("active", btn.textContent === label);
  });
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => console.log('Wake Lock was released'));
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