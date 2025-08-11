let speedTable = [1, 30, 45, 60, 75, 85, 95, 100]; // 1X to 8X speeds
let currentSpeed = speedTable[0];
let currentSpeedIndex = 0; // Index of main speed or -1 if finer speed
let currentFinerSpeed = null; // store current finer speed value if selected

let animationFrameId = null;
let lastTimestamp = null;
let wakeLock = null;

function smoothScroll(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  const distance = currentSpeed * deltaTime;
  window.scrollTo(0, window.scrollY + distance);
  animationFrameId = requestAnimationFrame(smoothScroll);
}

function startAutoScroll() {
  cancelAnimationFrame(animationFrameId);
  lastTimestamp = null;
  animationFrameId = requestAnimationFrame(smoothScroll);
}

// Generate finer increments between two main speeds
function generateFinerSpeeds(index1, index2) {
  const speed1 = speedTable[index1];
  const speed2 = speedTable[index2];
  const finerSpeeds = [];
  const increments = [0.2, 0.4, 0.6, 0.8];
  increments.forEach(step => {
    const label = `${(index1 + 1 + step).toFixed(1)}x`;
    const value = speed1 + (speed2 - speed1) * step;
    finerSpeeds.push({ label, value });
  });
  return finerSpeeds;
}

// Build buttons based on current selection (main or finer)
function buildButtons() {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";

  // Helper to create button and add active class if needed
  function createButton(label, isActive, onClick) {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (isActive) btn.classList.add("active");
    btn.onclick = onClick;
    return btn;
  }

  // Show main speeds + finer speeds depends on current selection

  if (currentSpeedIndex >= 0) {
    // Clicked a main speed: show that speed + all finer increments up to next main speed + next main speed
    const i = currentSpeedIndex;

    // Show clicked main speed
    controls.appendChild(createButton(`${i + 1}x`, true, () => handleMainSpeedClick(i)));

    // Show all finer increments between i and i+1
    if (i < speedTable.length - 1) {
      const finerSpeeds = generateFinerSpeeds(i, i + 1);
      finerSpeeds.forEach(({ label, value }) => {
        controls.appendChild(createButton(label, false, () => handleFinerSpeedClick(value)));
      });

      // Show next main speed
      controls.appendChild(createButton(`${i + 2}x`, false, () => handleMainSpeedClick(i + 1)));
    }
  } else {
    // Clicked a finer speed: find where it fits in between main speeds and show window around it

    // Find main speeds bracketing currentFinerSpeed
    let lowerIndex = 0;
    for (let j = 0; j < speedTable.length - 1; j++) {
      if (currentFinerSpeed > speedTable[j] && currentFinerSpeed < speedTable[j + 1]) {
        lowerIndex = j;
        break;
      }
    }

    // We want to show:
    // - previous main speed (lowerIndex)
    // - finer increments between lowerIndex and lowerIndex+1, including the clicked finer speed and some after it
    // - next main speed (lowerIndex+1)

    // Add previous main speed
    controls.appendChild(createButton(`${lowerIndex + 1}x`, false, () => handleMainSpeedClick(lowerIndex)));

    // Generate finer speeds between lowerIndex and lowerIndex+1
    const finerSpeeds = generateFinerSpeeds(lowerIndex, lowerIndex + 1);

    // Show all finer speeds, highlighting the clicked one, plus up to 2 after clicked finer speed if any
    let clickedIndex = finerSpeeds.findIndex(fs => Math.abs(fs.value - currentFinerSpeed) < 0.0001);

    // We'll show from start to clickedIndex + 2 (if possible)
    let maxIndexToShow = Math.min(clickedIndex + 2, finerSpeeds.length - 1);

    for (let k = 0; k <= maxIndexToShow; k++) {
      const { label, value } = finerSpeeds[k];
      controls.appendChild(createButton(label, k === clickedIndex, () => handleFinerSpeedClick(value)));
    }

    // Show next main speed
    controls.appendChild(createButton(`${lowerIndex + 2}x`, false, () => handleMainSpeedClick(lowerIndex + 1)));
  }
}

function handleMainSpeedClick(index) {
  currentSpeed = speedTable[index];
  currentSpeedIndex = index;
  currentFinerSpeed = null;
  buildButtons();
}

function handleFinerSpeedClick(speedValue) {
  currentSpeed = speedValue;
  currentSpeedIndex = -1; // indicate finer speed selected
  currentFinerSpeed = speedValue;
  buildButtons();
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
  requestWakeLock();
};
