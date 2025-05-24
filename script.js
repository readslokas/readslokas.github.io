// scripts.js
let speedLevel = 0;
let speedPixelsPerSecond = 0;
let lastTimestamp = null;
let wakeLock = null;
let animationFrameId = null;

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
  const speedTable = [1, 60, 90, 110, 130, 150, 170]; 
  speedLevel = parseInt(newSpeed);
  speedPixelsPerSecond = speedTable[speedLevel];
  
  // Request fullscreen when speed changes
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.mozRequestFullScreen) { // Firefox
    document.documentElement.mozRequestFullScreen();
  } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
    document.documentElement.webkitRequestFullscreen();
  } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
    document.documentElement.msRequestFullscreen();
  }
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

window.onload = function() {
  startAutoScroll();
  requestWakeLock();
};
