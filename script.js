
    let currentSpeed = 1.0;
    let speedPixelsPerSecond = 50;
    let lastTimestamp = null;
    let animationFrameId = null;
    let wakeLock = null;

    const integerSpeeds = [1, 2, 3, 4, 5, 6, 7]; // integer set

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

    function buildButtons(centerValue = currentSpeed) {
      const controls = document.getElementById("controls");
      controls.innerHTML = "";

      let values = [];

      // If center is integer ? just show integer set
      if (Number.isInteger(centerValue)) {
        values = integerSpeeds;
      } else {
        // Fraction clicked ? 7 consecutive values around it
        const step = 0.1;
        for (let i = -3; i <= 3; i++) {
          values.push(parseFloat((centerValue + i * step).toFixed(1)));
        }
      }

      values.forEach(val => {
        const btn = document.createElement("button");
        btn.textContent = `${val}x`;
        btn.onclick = () => handleClick(val);
        if (val === currentSpeed) btn.classList.add("active");
        controls.appendChild(btn);
      });
    }

    function handleClick(val) {
      currentSpeed = val;
      speedPixelsPerSecond = val * 50;
      buildButtons(val);
    }

    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => console.log('Wake Lock released'));
        }
      } catch (err) {
        console.error(err);
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

