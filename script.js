let speedLevel = 0;
let speedPixelsPerSecond = 0;
let lastTimestamp = null;
let animationFrameId = null;
let wakeLock = null; // Variable for wake lock

function smoothScroll(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = (timestamp - lastTimestamp) / 1000; // seconds
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
  // Define how many pixels per second for each level
  const speedTable = [1, 30, 60, 85, 100, 115, 125]; 
  speedLevel = parseInt(newSpeed);
  speedPixelsPerSecond = speedTable[speedLevel];
}

// Request Wake Lock to keep the screen on
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
  // Re-request wake lock when the page becomes visible again
  if (document.visibilityState === 'visible' && wakeLock === null) {
    requestWakeLock();
  }
});

// On page load, start scrolling and request wake lock
window.onload = function() {
  startAutoScroll();
  requestWakeLock();  // Request wake lock to keep the screen on
};
