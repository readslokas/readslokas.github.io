class AutoScroller {
  constructor() {
    this.#speedTable = [10, 30, 55, 80, 90, 96, 100];
    this.#currentSpeedIndex = 0;
    this.#speedPixelsPerSecond = 0.5;
    this.#lastTimestamp = null;
    this.#animationFrameId = null;
    // New state variable to track the currently selected speed label.
    // We use a string to handle both integer and decimal values.
    this.#selectedSpeedLabel = "1x";
    this.#controls = document.getElementById("controls");
    this.#init();
  }

  #init() {
    this.buildButtons();
    this.startAutoScroll();
    this.#requestWakeLock();
    document.addEventListener('visibilitychange', () => this.#handleVisibilityChange());
  }

  #getDeltaTime(timestamp) {
    const MILLISECONDS_IN_SECOND = 1000;
    if (!this.#lastTimestamp) this.#lastTimestamp = timestamp;
    const deltaTime = (timestamp - this.#lastTimestamp) / MILLISECONDS_IN_SECOND;
    this.#lastTimestamp = timestamp;
    return deltaTime;
  }

  smoothScroll = (timestamp) => {
    const deltaTime = this.#getDeltaTime(timestamp);
    const distance = this.#speedPixelsPerSecond * deltaTime;
    window.scrollTo(0, window.scrollY + distance);
    this.#animationFrameId = requestAnimationFrame(this.smoothScroll);
  }

  startAutoScroll() {
    cancelAnimationFrame(this.#animationFrameId);
    this.#lastTimestamp = null;
    this.#animationFrameId = requestAnimationFrame(this.smoothScroll);
  }

  // The main button building logic is now much more dynamic.
  buildButtons() {
    this.#controls.innerHTML = "";
    // Check if the current speed label is a whole number (e.g., "1x", "2x").
    if (this.#selectedSpeedLabel.endsWith("x") && !this.#selectedSpeedLabel.includes(".")) {
      // If it's a whole number, show all whole number buttons.
      this.#speedTable.forEach((_, i) => {
        const label = `${i + 1}x`;
        this.#createButton(i, label, label === this.#selectedSpeedLabel);
      });
    } else {
      // If a decimal speed is selected, we need to generate a specific set of buttons.
      this.#generateExpandedButtons();
    }
  }

  // A new method to handle the expanded button view.
  #generateExpandedButtons() {
    // Extract the base integer from the decimal label (e.g., "2.4x" -> 2).
    const baseNumber = parseInt(this.#selectedSpeedLabel, 10);
    const baseIndex = baseNumber - 1;
    const nextIndex = baseIndex + 1;

    // Create the base button (e.g., 2x).
    this.#createButton(baseIndex, `${baseNumber}x`);
    
    // Generate and add the decimal buttons.
    this.#generateFinerButtons(baseIndex, nextIndex);
    
    // Create the next whole number button (e.g., 3x).
    if (nextIndex < this.#speedTable.length) {
      this.#createButton(nextIndex, `${nextIndex + 1}x`);
    }
  }

  // This helper is now more flexible.
  #createButton(index, label, isActive = false) {
    const btn = document.createElement("button");
    btn.textContent = label;
    // We now have two different click handlers based on the button type.
    if (label.includes(".")) {
      // For decimal buttons, just update the speed.
      const value = this.#getInterpolatedSpeed(index, index + 1, parseFloat(label.slice(1, -1)) - index);
      btn.onclick = () => this.#updateSpeed(value, label);
    } else {
      // For whole number buttons, update the speed and rebuild the UI.
      btn.onclick = () => {
        this.#handleSpeedClick(index);
        this.#updateSpeed(this.#getSpeedValue(index), label);
      };
    }
    if (isActive) btn.classList.add("active");
    this.#controls.appendChild(btn);
  }

  // Simplified and separated logic.
  #handleSpeedClick(index) {
    // This function's sole purpose is now to update the speed and rebuild the UI.
    const label = `${index + 1}x`;
    this.#selectedSpeedLabel = label;
    this.buildButtons();
  }

  // This function now dynamically generates decimal steps based on the current selection.
  #generateFinerButtons(index1, index2) {
    const startStep = parseFloat(this.#selectedSpeedLabel.split(".")[1] || "0");
    const fineLabels = [];

    // Determine which decimal steps to show based on the current selection.
    for (let i = 0; i < 10; i++) {
      const step = i * 0.1;
      // We only want to show 5 decimal buttons at a time, centered around the selected one.
      if (Math.abs(step - startStep / 10) <= 0.2) {
        const fullLabel = `${(index1 + 1 + step).toFixed(1)}x`;
        fineLabels.push(fullLabel);
      }
    }
    
    // Create buttons for the selected decimal speeds.
    fineLabels.forEach(label => {
      const btn = document.createElement("button");
      btn.textContent = label;
      const value = this.#getInterpolatedSpeed(index1, index2, parseFloat(label) - (index1 + 1));
      btn.onclick = () => this.#updateSpeed(value, label);
      if (label === this.#selectedSpeedLabel) btn.classList.add("active");
      this.#controls.appendChild(btn);
    });
  }
  
  // New helper to get the interpolated speed value.
  #getInterpolatedSpeed(index1, index2, step) {
    const speed1 = this.#speedTable[index1];
    const speed2 = this.#speedTable[index2];
    return speed1 + ((speed2 - speed1) * step);
  }
  
  // New helper to get the whole number speed value.
  #getSpeedValue(index) {
    return index === 0 ? 0.5 : this.#speedTable[index];
  }

  // Simplified update speed function.
  #updateSpeed(value, label) {
    this.#speedPixelsPerSecond = value;
    this.#selectedSpeedLabel = label;
    this.#highlightButton();
  }

  // Highlight logic is now based on the selected speed label.
  #highlightButton() {
    document.querySelectorAll("#controls button").forEach(btn => {
      btn.classList.toggle("active", btn.textContent === this.#selectedSpeedLabel);
    });
  }

  async #requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.#wakeLock = await navigator.wakeLock?.request('screen');
        console.log('Wake Lock is active');
        this.#wakeLock?.addEventListener('release', () => console.log('Wake Lock was released'));
      } else {
        console.warn('Wake Lock API not supported on this browser.');
      }
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }

  #handleVisibilityChange() {
    if (this.#wakeLock !== null && document.visibilityState === 'visible') {
      this.#requestWakeLock();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AutoScroller();
});