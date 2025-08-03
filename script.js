<script>
let speedTable = [1, 30, 40, 50, 60, 75, 100];
let currentSpeedIndex = 0;
let speedPixelsPerSecond = speedTable[0];
let expandedIndex = null; // Tracks which speed is currently expanded

function startAutoScroll() {
  cancelAnimationFrame(animationFrameId);
  lastTimestamp = null;
  animationFrameId = requestAnimationFrame(smoothScroll);
}

function smoothScroll(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  const distance = speedPixelsPerSecond * deltaTime;
  window.scrollTo(0, window.scrollY + distance);
  animationFrameId = requestAnimationFrame(smoothScroll);
}

function requestWakeLock() {
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').then(lock => {
      wakeLock = lock;
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock released');
      });
    }).catch(console.error);
  }
}

document.addEventListener('visibilitychange', () => {
  if (wakeLock && document.visibilityState === 'visible') {
    requestWakeLock();
  }
});

function buildButtons() {
  const controls = document.getElementById("controls");
  controls.innerHTML = "";
  for (let i = 0; i < speedTable.length; i++) {
    const btn = document.createElement("button");
    btn.textContent = `${i + 1}x`;
    btn.onclick = () => handleSpeedClick(i);
    if (i === currentSpeedIndex) btn.classList.add("active");
    controls.appendChild(btn);

    // Insert fine-grained speeds if expanded at this index
    if (expandedIndex === i && i < speedTable.length - 1) {
      const finerSpeeds = generateFineSpeeds(speedTable[i], speedTable[i + 1], 5);
      finerSpeeds.forEach((val, j) => {
        const fineBtn = document.createElement("button");
        fineBtn.textContent = `${(i + 1) + ((j + 1) / (finerSpeeds.length + 1))}x`;
        fineBtn.onclick = () => {
          speedPixelsPerSecond = val;
          currentSpeedIndex = -1; // No main index active
          updateActiveButton(fineBtn);
        };
        controls.appendChild(fineBtn);
      });
    }
  }
}

function handleSpeedClick(index) {
  if (expandedIndex === index) {
    expandedIndex = null; // Collapse
  } else {
    expandedIndex = index; // Expand this index
  }
  speedPixelsPerSecond = speedTable[index];
  currentSpeedIndex = index;
  buildButtons();
}

function generateFineSpeeds(start, end, count) {
  const step = (end - start) / (count + 1);
  return Array.from({ length: count }, (_, i) => start + step * (i + 1));
}

function updateActiveButton(activeBtn) {
  document.querySelectorAll("#controls button").forEach(btn => {
    btn.classList.toggle("active", btn === activeBtn);
  });
}

window.onload = function () {
  buildButtons();
  requestWakeLock();
  startAutoScroll();
};
</script>
