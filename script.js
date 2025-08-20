let speedTable = [10, 30, 55, 80, 90, 96, 100];
let currentSpeedIndex = 0;
let speedPixelsPerSecond = 0.5; // start at 1x slow
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null;
let wakeLock = null;

// To track dynamic finer buttons
let dynamicFiner = {};

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
    // Show top-level buttons only
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
      const finerButtons = generateFinerButtons(curr, next);
      finerButtons.forEach(({ label, value }, idx) => {
        const fineBtn = document.createElement("button");
        fineBtn.textContent = label;

        fineBtn.onclick = () => {
          speedPixelsPerSecond = value;
          currentSpeedIndex = -1;
          highlightButton(fineBtn);

          // Insert the **next** decimal button
          const num = parseFloat(label);
          const nextDecimal = num + 0.1;

          // Only insert if it's within the upper bound
          const upperBound = parseFloat(finerButtons[finerButtons.length - 1].label);
          if (nextDecimal <= upperBound) {
            dynamicFiner[curr] = { insert: nextDecimal };
          } else {
            delete dynamicFiner[curr];
          }

          buildButtons();
        };

        controls.appendChild(fineBtn);
      });

      // Insert dynamic finer button if exists
      if (dynamicFiner[curr]) {
        const { insert } = dynamicFiner[curr];
        const insertBtn = document.createElement("button");
        insertBtn.textContent = `${insert.toFixed(1)}x`;
        insertBtn.onclick = () => {
          speedPixelsPerSecond = speedTable[curr] +
            ((speedTable[next] - speedTable[curr]) * (insert - (curr + 1)));
          highlightButton(insertBtn);
        };

        // Place after the clicked finer button
        const allButtons = Array.from(controls.querySelectorAll("button"));
        const leftIndex = allButtons.findIndex(
          b => parseFloat(b.textContent) === insert - 0.1
        );
        controls.insertBefore(insertBtn, allButtons[leftIndex + 1]);
      }

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
    // Special case: 1x speed = slow
    if (index === 0) {
      speedPixelsPerSecond = 0.5;
    } else {
      speedPixelsPerSecond = speedTable[index];
    }
    dynamicFiner = {}; // reset dynamic finer buttons when switching full numbers
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
    const fullLabel = `${(index1 + 1 + step).toFixed(1)}x`;
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
      wakeLock.addEventListener('release', () => console.log('Wake Lock was released'));
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