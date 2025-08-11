<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Speed Buttons</title>
  <style>
    #controls {
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      background: #f5f5f5;
      padding: 10px;
      z-index: 9999;
    }

    #controls button {
      padding: 8px 12px;
      font-size: 16px;
      cursor: pointer;
    }

    #controls button.active {
      background-color: #007bff;
      color: white;
    }
  </style>
</head>
<body>

<div id="controls"></div>

<script>
  let speedTable = [10, 30, 55, 80, 90, 96, 100]; // 1x to 7x
  let currentSpeedIndex = 0;
  let speedPixelsPerSecond = speedTable[0];
  let lastTimestamp = null;
  let animationFrameId = null;
  let wakeLock = null;
  let selectedLabel = null;

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
    controls.innerHTML = ""; // ✅ Corrected

    const buttons = [];

    if (selectedLabel === null) {
      // Default view: 1x to 7x
      for (let i = 0; i < speedTable.length; i++) {
        const btn = document.createElement("button");
        btn.textContent = `${i + 1}x`;
        btn.onclick = () => handleSpeedClick(i);
        if (i === currentSpeedIndex) btn.classList.add("active");
        buttons.push(btn);
      }
    } else if (selectedLabel.endsWith("x") && selectedLabel.includes(".")) {
      // A finer speed was selected
      const selectedValue = parseFloat(selectedLabel);
      const mainIndex = Math.floor(selectedValue - 1);
      const prevMain = mainIndex;
      const nextMain = mainIndex + 1;

      const finer = generateFinerButtons(prevMain, nextMain);
      const selectedIndex = finer.findIndex(f => f.label === selectedLabel);

      const start = Math.max(0, selectedIndex - 2);
      const end = Math.min(finer.length - 1, start + 4);

      // Add previous main
      if (prevMain >= 0) {
        const btn = document.createElement("button");
        btn.textContent = `${prevMain + 1}x`;
        btn.onclick = () => handleSpeedClick(prevMain);
        buttons.push(btn);
      }

      // Add finer steps
      for (let i = start; i <= end; i++) {
        const btn = document.createElement("button");
        btn.textContent = finer[i].label;
        btn.onclick = () => handleFinerClick(finer[i].value, finer[i].label);
        if (finer[i].label === selectedLabel) btn.classList.add("active");
        buttons.push(btn);
      }

      // Add next main
      if (nextMain < speedTable.length) {
        const btn = document.createElement("button");
        btn.textContent = `${nextMain + 1}x`;
        btn.onclick = () => handleSpeedClick(nextMain);
        buttons.push(btn);
      }

      while (buttons.length > 7) buttons.pop();
    } else {
      // A main speed was selected
      const index = selectedLabel;
      const currLabel = `${index + 1}x`;
      const nextIndex = index + 1;
      const prevIndex = index - 1;

      const btnCurr = document.createElement("button");
      btnCurr.textContent = currLabel;
      btnCurr.classList.add("active");
      btnCurr.onclick = () => handleSpeedClick(index);
      buttons.push(btnCurr);

      if (nextIndex < speedTable.length) {
        const finer = generateFinerButtons(index, nextIndex);
        finer.forEach(f => {
          const btn = document.createElement("button");
          btn.textContent = f.label;
          btn.onclick = () => handleFinerClick(f.value, f.label);
          buttons.push(btn);
        });

        const btnNext = document.createElement("button");
        btnNext.textContent = `${nextIndex + 1}x`;
        btnNext.onclick = () => handleSpeedClick(nextIndex);
        buttons.push(btnNext);
      }

      // Add previous main if needed
      if (buttons.length < 7 && prevIndex >= 0) {
        const btnPrev = document.createElement("button");
        btnPrev.textContent = `${prevIndex + 1}x`;
        btnPrev.onclick = () => handleSpeedClick(prevIndex);
        buttons.unshift(btnPrev);
      }

      while (buttons.length > 7) buttons.pop();
    }

    buttons.forEach(btn => controls.appendChild(btn));
  }

  function handleSpeedClick(index) {
    currentSpeedIndex = index;
    speedPixelsPerSecond = speedTable[index];
    selectedLabel = index;
    buildButtons();
  }

  function handleFinerClick(value, label) {
    speedPixelsPerSecond = value;
    currentSpeedIndex = -1;
    selectedLabel = label;
    buildButtons();
  }

  function generateFinerButtons(index1, index2) {
    const speed1 = speedTable[index1];
    const speed2 = speedTable[index2];
    const fineSpeeds = [];

    for (let i = 1; i <= 5; i++) {
      const step = 0.2 * i;
      const label = `${(index1 + 1 + step).toFixed(1)}x`;
      const value = speed1 + ((speed2 - speed1) * step);
      fineSpeeds.push({ label, value });
    }

    return fineSpeeds;
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
    selectedLabel = null;
    buildButtons();
    startAutoScroll();
    requestWakeLock(); // Prevent screen from sleeping
  };
</script>

</body>
</html>
