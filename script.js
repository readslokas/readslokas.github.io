let speedLevel = 0;
let speedPixelsPerSecond = 0;
let lastTimestamp = null;
let wakeLock = null;
let animationFrameId = null;

function smoothScroll(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  const distance = speedPixelsPerSecond * deltaTime;
  window.scrollTo(0, window.scrollY + distance);

  animationFrameId = requestAnimationFrame(smoothScroll);
}

function startAutoScroll() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  lastTimestamp = null;
  animationFrameId = requestAnimationFrame(smoothScroll);
}

function changeSpeed(newSpeed) {
  const speedTable = [1, 30, 40, 50, 60, 75, 100];
  speedLevel = parseInt(newSpeed);
  speedPixelsPerSecond = speedTable[speedLevel];

  // Highlight the active button
  document.querySelectorAll('#controls button').forEach((btn, idx) => {
    if (idx === speedLevel) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
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

window.onload = function () {
  startAutoScroll();
  requestWakeLock();
  changeSpeed(0); // Set initial speed and highlight first button
};
