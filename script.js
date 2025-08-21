let baseSpeeds = [0.5, 15, 30, 55, 80, 100]; // 1x=0.5, 2x=15, 3x=30, 4x=55, 5x=80, 6x=100
let currentSpeed = baseSpeeds[0];
let lastTimestamp = null;
let animationFrameId = null;
let expandedIndex = null;
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

function buildButtons() {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";

  if (expandedIndex === null) {
    // default view → whole numbers only
    for (let i = 0; i < baseSpeeds.length; i++) {
      const btn = document.createElement("button");
      btn.textContent = `${i + 1}x`;
      btn.onclick = () => expandSpeed(i);
      controls.appendChild(btn);
    }
  } else {
    // expanded view
    const curr = expandedIndex;
    if (curr === 0) {
      // Special case for 1x (0.5 speed)
      addButton("1x", baseSpeeds[0], true);
      const finer = generateFinerButtons(curr, curr + 1);
      finer.forEach(f => addButton(f.label, f.value));
      addButton("2x", baseSpeeds[1]);
    } else if (curr < baseSpeeds.length - 1) {
      addButton(`${curr + 1}x`, baseSpeeds[curr], true);
      const finer = generateFinerButtons(curr, curr + 1);
      finer.forEach(f => addButton(f.label, f.value));
      addButton(`${curr + 2}x`, baseSpeeds[curr + 1]);
    } else {
      // last one (6x), no expansion
      for (let i = 0; i < baseSpeeds.length; i++) {
        addButton(`${i + 1}x`, baseSpeeds[i]);
      }
    }
  }
}

function addButton(label, value, active = false) {
  const controls = document.getElementById("controls");
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.onclick = () => {
    currentSpeed = value;
    highlightButton(btn);
  };
  if (active) highlightButton(btn);
  controls.appendChild(btn);
}

function expandSpeed(index) {
  expandedIndex = (expandedIndex === index ? null : index);
  if (expandedIndex !== null) currentSpeed = baseSpeeds[index];
  buildButtons();
}

function generateFinerButtons(index1, index2) {
  const s1 = baseSpeeds[index1];
  const s2 = baseSpeeds[index2];
  const fine = [];
  [0.2, 0.4, 0.6, 0.8].forEach(step => {
    const label = `${(index1 + 1 + step).toFixed(1)}x`;
    const val = s1 + (s2 - s1) * step;
    fine.push({ label, value: val });
  });
  return fine;
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
