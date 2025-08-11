let speedTable = [0, 10, 30, 55, 80, 90, 96, 100]; 
// Note: 0 speed for 1x, then speeds for 1.2x, 2x, 3x... (adjust if you want)

let currentSpeedIndex = 0; // start at 1x (no scroll)
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

  // Always add 1x fixed on left
  const btnOne = document.createElement("button");
  btnOne.textContent = "1x";
  btnOne.onclick = () => handleSpeedClick(0);
  if (currentSpeedIndex === 0) btnOne.classList.add("active");
  controls.appendChild(btnOne);

  if (expandedIndex === null || expandedIndex === 0) {
    // Collapsed: show whole numbers starting from 1.2x (index 1) onward
    for (let i = 1; i < speedTable.length; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${(i === 1 ? 1.2 : i + 0) }x`; // Customize label for index 1 as 1.2x
      btn.onclick = () => handleSpeedClick(i);
      if (i === currentSpeedIndex) btn.classList.add("active");
      controls.appendChild(btn);
    }
  } else {
    // Expanded mode, show 6 buttons around expandedIndex
    const expandedButtons = getExpandedButtons(expandedIndex);

    expandedButtons.forEach(btnData => {
      const btn = document.createElement("button");
      btn.textContent = btnData.label;
      btn.onclick = () => {
        if (btnData.isMain) {
          handleSpeedClick(btnData.index);
        } else {
          speedPixelsPerSecond = btnData.value;
          currentSpeedIndex = -1;
          highlightButton(btn);
        }
      };
      if (
        (btnData.isMain && btnData.index === currentSpeedIndex) ||
        (!btnData.isMain && speedPixelsPerSecond === btnData.value)
      ) {
        btn.classList.add("active");
      }
      controls.appendChild(btn);
    });
  }
}

function getExpandedButtons(centerIndex) {
  // Build main + finer buttons between 1.2x and onwards (index 1 to end)
  let allButtons = [];

  for (let i = 1; i < speedTable.length; i++) {
    const label = i === 1 ? "1.2x" : `${i}x`;
    allButtons.push({ label, index: i, isMain: true, value: speedTable[i] });
    if (i < speedTable.length - 1) {
      allButtons.push(...generateFinerButtons(i, i + 1));
    }
  }

  // Find center position by label matching
  const centerLabel = centerIndex === 1 ? "1.2x" : `${centerIndex}x`;
  let centerPos = allButtons.findIndex(b => b.label === centerLabel);
  if (centerPos === -1) centerPos = 0;

  let start = centerPos - 2;
  if (start < 0) start = 0;
  if (start + 6 > allButtons.length) start = allButtons.length - 6;

  return allButtons.slice(start, start + 6);
}

function generateFinerButtons(index1, index2) {
  const speed1 = speedTable[index1];
  const speed2 = speedTable[index2];
  const finer = [];

  for (let i = 1; i <= 5; i++) {
    const step = 0.2 * i;
    const labelValue = (index1 === 1 ? 1.2 : index1) + step;
    if (labelValue >= speedTable.length) break;
    const label = `${labelValue.toFixed(1)}x`;
    const value = speed1 + ((speed2 - speed1) * (step / 1)); // Linear interpolation
    finer.push({ label, index: -1, isMain: false, value });
  }
  return finer;
}

function handleSpeedClick(index) {
  if (expandedIndex === index) {
    // Collapse if same clicked
    expandedIndex = null;
    speedPixelsPerSecond = speedTable[index];
    currentSpeedIndex = index;
  } else {
    if (index === 0) {
      // 1x clicked: collapse and zero speed
      expandedIndex = null;
      speedPixelsPerSecond = 0;
      currentSpeedIndex = 0;
    } else {
      expandedIndex = index;
      speedPixelsPerSecond = speedTable[index];
      currentSpeedIndex = index;
    }
  }
  buildButtons();
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
