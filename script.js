let speedTable = [0, 10, 30, 55, 80, 90, 96, 100]; // 0 = no scroll for 1x
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

  // Always render 1x
  const btn1x = document.createElement("button");
  btn1x.textContent = "1x";
  btn1x.onclick = () => {
    expandedIndex = 0;
    currentSpeedIndex = 0;
    speedPixelsPerSecond = speedTable[0];
    buildButtons();
  };
  if (currentSpeedIndex === 0 || expandedIndex === 0) btn1x.classList.add("active");
  controls.appendChild(btn1x);

  if (expandedIndex === null) {
    // Show whole number speeds starting from 2x
    for (let i = 1; i < Math.min(speedTable.length, 7); i++) {
      const btn = document.createElement("button");
      btn.textContent = `${i + 1}x`;
      btn.onclick = () => handleSpeedClick(i);
      if (i === currentSpeedIndex) btn.classList.add("active");
      controls.appendChild(btn);
    }
  } else {
    // Expanded view: show 1x + main + decimals + next
    const center = expandedIndex;

    const btnMain = document.createElement("button");
    btnMain.textContent = `${center + 1}x`;
    btnMain.classList.add("active");
    btnMain.onclick = () => handleSpeedClick(center);
    controls.appendChild(btnMain);

    const fineButtons = generateFinerButtons(center);
    fineButtons.forEach(({ label, value }) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.onclick = () => {
        speedPixelsPerSecond = value;
        currentSpeedIndex = -1;
        highlightButton(btn);
      };
      controls.appendChild(btn);
    });

    // Append the next whole number if it exists
    if (center + 1 < speedTable.length) {
      const btnNext = document.createElement("button");
      btnNext.textContent = `${center + 2}x`;
      btnNext.onclick = () => handleSpeedClick(center + 1);
      if (currentSpeedIndex === center + 1) btnNext.classList.add("active");
      controls.appendChild(btnNext);
    }
  }
}

function handleSpeedClick(index) {
  if (expandedIndex === index) {
    // Collapse view
    expandedIndex = null;
  } else {
    expandedIndex = index;
    speedPixelsPerSecond = speedTable[index];
  }
  currentSpeedIndex = index;
  buildButtons();
}

function generateFinerButtons(index) {
  const buttons = [];
  const speed1 = speedTable[index];
  const speed2 = speedTable[index + 1] ?? speed1;
  const steps = [0.2, 0.4, 0.6, 0.8];

  steps.forEach(step => {
    const label = `${(index + 1 + step).toFixed(1)}x`;
    let value = speed1 + (speed2 - speed1) * step;

    // Ensure small non-zero speeds are visible
    if (value < 2 && value > 0) value = 2;

    buttons.push({ label, value });
  });

  return buttons;
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
