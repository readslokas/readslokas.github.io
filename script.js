let speedTable = [10, 30, 55, 80, 90, 96, 100];
let currentSpeedIndex = 0;
let speedPixelsPerSecond = 0.5; 
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null;
let wakeLock = null;

// Store dynamically added finer speeds
let dynamicFinerSpeeds = {}; // Example: { "1-2": [ {label: "1.1x", value: 12}, ... ] }

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
    // Show only main speeds
    for (let i = 0; i < speedTable.length; i++) {
      const btn = createButton(`${i + 1}x`, () => handleSpeedClick(i));
      if (i === currentSpeedIndex) btn.classList.add("active");
      controls.appendChild(btn);
    }
  } else {
    // Show finer controls around selected index
    const prev = expandedIndex - 1;
    const curr = expandedIndex;
    const next = expandedIndex + 1;

    // Add previous main speed button
    if (prev >= 0) {
      const btnPrev = createButton(`${prev + 1}x`, () => handleSpeedClick(prev));
      controls.appendChild(btnPrev);
    }

    // Add current main speed
    const btnCurr = createButton(`${curr + 1}x`, () => handleSpeedClick(curr));
    btnCurr.classList.add("active");
    controls.appendChild(btnCurr);

    // Generate finer buttons between current and next
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
    // Collapse back to main speeds
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

  // Parse clicked decimal, figure out its neighbors
  const clicked = parseFloat(label);
  const finerArray = dynamicFinerSpeeds[`${index1}-${index2}`] || [];

  // Find where to insert new finer button (midpoint logic)
  for (let i = 0; i < finerArray.length - 1; i++) {
    const curr = parseFloat(finerArray[i].label);
    const next = parseFloat(finerArray[i + 1].label);
    if (Math.abs(clicked - curr) < 0.001) {
      // Insert midpoint between clicked and next
      const midValue = speedTable[index1] + ((speedTable[index2] - speedTable[index1]) * ((next - clicked)));
      const midLabel = `${((clicked + next) / 2).toFixed(1)}x`;
      finerArray.splice(i + 1, 0, { label: midLabel, value: midValue });
      break;
    }
  }

  // Save updated finer speeds
  dynamicFinerSpeeds[`${index1}-${index2}`] = finerArray;
  highlightButton(label);
  buildButtons();
}

function generateFinerButtons(index1, index2) {
  const key = `${index1}-${index2}`;
  if (!dynamicFinerSpeeds[key]) {
    // Initialize with .2, .4, .6, .8
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