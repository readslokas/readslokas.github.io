let speedTable = [10, 30, 55, 80, 90, 96, 100];

    // State
    let currentSpeedIndex = 0;               // index into speedTable for full steps
    let speedPixelsPerSecond = 0.5;          // start at super-slow 1x
    let lastTimestamp = null;
    let animationFrameId = null;
    let expandedIndex = null;                // which full step is expanded (0-based). null = collapsed (all full buttons)
    let wakeLock = null;

    // Fractional state
    let fractionalActive = false;            // true after a fractional button is clicked
    let selectedFractionValue = null;        // numeric like 2.4, 3.2 etc (label number)

    // --- scrolling loop ---
    function smoothScroll(timestamp) {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const dt = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;
      const distance = speedPixelsPerSecond * dt;
      window.scrollTo(0, window.scrollY + distance);
      animationFrameId = requestAnimationFrame(smoothScroll);
    }
    function startAutoScroll() {
      cancelAnimationFrame(animationFrameId);
      lastTimestamp = null;
      animationFrameId = requestAnimationFrame(smoothScroll);
    }

    // --- UI building ---
    function buildButtons() {
      const controls = document.getElementById("controls");
      controls.innerHTML = "";

      if (expandedIndex === null) {
        // Collapsed: show all full-number buttons
        for (let i = 0; i < speedTable.length; i++) {
          const btn = makeFullButton(i);
          if (i === currentSpeedIndex && !fractionalActive) btn.classList.add("active");
          controls.appendChild(btn);
        }
        return;
      }

      const curr = expandedIndex;
      const prev = curr - 1;
      const next = curr + 1;

      // Determine list to render
      // Base list: [prevFull?], currFull, fractions (0.2,0.4,0.6,0.8), nextFull
      // If a fractional was clicked:
      //  - remove prevFull
      //  - insert midpoint between selectedFraction and its right neighbor (fraction or next full) in correct position.

      const items = [];

      // Include previous full only if NOT in fractional mode and it exists
      if (!fractionalActive && prev >= 0) {
        items.push({ type: "full", index: prev, label: (prev + 1).toFixed(0) + "x" });
      }

      // Current full
      items.push({ type: "full", index: curr, label: (curr + 1).toFixed(0) + "x" });

      // Fractions between curr and next (if next exists)
      let fractions = [];
      if (next < speedTable.length) {
        const base = curr + 1; // numeric label for current full (e.g., 2 for "2x")
        const steps = [0.2, 0.4, 0.6, 0.8];
        fractions = steps.map(s => ({ type: "frac", value: +(base + s).toFixed(1), label: (base + s).toFixed(1) + "x" }));
      }

      // If fractional mode is active, inject midpoint and remove prev full
      if (fractionalActive && selectedFractionValue != null) {
        // Remove prev full if present at start of list
        if (items.length >= 2 && items[0].type === "full" && items[0].index === prev) {
          items.shift();
        }

        // Find the right neighbor for the selected fraction
        // Build a working array: [currFull, fractions..., nextFull]
        let working = [{ type: "full", index: curr, label: (curr + 1) + "x" }].concat(fractions);
        if (next < speedTable.length) {
          working.push({ type: "full", index: next, label: (next + 1) + "x" });
        }

        // Locate selected fraction index within working (by numeric value)
        const idxSel = working.findIndex(x => x.type === "frac" && x.value === +selectedFractionValue);
        if (idxSel !== -1) {
          // Determine right neighbor: if next element exists, use it; else none
          const right = working[idxSel + 1];
          // Compute midpoint label between selected and right neighbor:
          // - if right is a fraction -> midpoint is +0.1
          // - if right is next full -> midpoint is .9 (e.g., 2.9)
          if (right) {
            let midValue;
            if (right.type === "frac") {
              midValue = +( (working[idxSel].value + right.value) / 2 ).toFixed(1); // e.g., 2.5 between 2.4 and 2.6
            } else {
              // right is next full: midpoint between e.g. 2.8 and 3.0 -> 2.9
              midValue = +( (working[idxSel].value + (curr + 2)) / 2 ).toFixed(1); // (2.8 + 3.0)/2 = 2.9
            }
            // Insert fractions into items, placing midpoint after the selected fraction
            // Final order: currFull, [fractions with midpoint inserted], nextFull
            let built = [{ type: "full", index: curr, label: (curr + 1) + "x" }];
            for (let i = 0; i < fractions.length; i++) {
              built.push(fractions[i]);
              if (fractions[i].value === working[idxSel].value) {
                // Insert midpoint immediately after the selected fraction
                // Only if it doesn't already exist
                if (!fractions.some(f => f.value === midValue)) {
                  built.push({ type: "frac", value: midValue, label: midValue.toFixed(1) + "x", isMid: true });
                }
              }
            }
            // Append next full
            if (next < speedTable.length) {
              built.push({ type: "full", index: next, label: (next + 1) + "x" });
            }
            // Replace items with built list
            // (items currently has only currFull because we may have shifted prev away)
            items.length = 0;
            items.push(...built);
          } else {
            // No right neighbor (edge case) -> just keep standard layout without midpoint
            items.push(...fractions);
            if (next < speedTable.length) items.push({ type: "full", index: next, label: (next + 1) + "x" });
          }
        } else {
          // Selected fraction not found (shouldn't happen) -> fallback
          items.push(...fractions);
          if (next < speedTable.length) items.push({ type: "full", index: next, label: (next + 1) + "x" });
        }
      } else {
        // Not in fractional mode: normal expanded set
        items.push(...fractions);
        if (next < speedTable.length) items.push({ type: "full", index: next, label: (next + 1) + "x" });
      }

      // Render buttons in order
      items.forEach(item => {
        let btn;
        if (item.type === "full") {
          btn = makeFullButton(item.index);
          const isActiveFull = (!fractionalActive && item.index === currentSpeedIndex);
          if (isActiveFull) btn.classList.add("active");
        } else {
          btn = makeFractionButton(item.value);
          const isActiveFrac = (fractionalActive && selectedFractionValue === item.value);
          if (isActiveFrac) btn.classList.add("active");
        }
        controls.appendChild(btn);
      });
    }

    // Create a full-number button (1x, 2x, ...)
    function makeFullButton(index) {
      const btn = document.createElement("button");
      btn.textContent = `${index + 1}x`;
      btn.onclick = () => {
        if (expandedIndex === index && !fractionalActive) {
          // collapse back to all full buttons
          expandedIndex = null;
          currentSpeedIndex = index;
          // apply speed (special case 1x)
          if (index === 0) speedPixelsPerSecond = 0.5; else speedPixelsPerSecond = speedTable[index];
          buildButtons();
          return;
        }
        // expand this band
        expandedIndex = index;
        fractionalActive = false;
        selectedFractionValue = null;
        currentSpeedIndex = index;
        // apply speed for the full step
        if (index === 0) speedPixelsPerSecond = 0.5; else speedPixelsPerSecond = speedTable[index];
        buildButtons();
      };
      return btn;
    }

    // Create a fractional button (e.g., 2.4x)
    function makeFractionButton(valueNum) {
      const btn = document.createElement("button");
      btn.textContent = `${valueNum.toFixed(1)}x`;
      btn.onclick = () => {
        fractionalActive = true;
        selectedFractionValue = +valueNum.toFixed(1);
        // Compute interpolated speed between expandedIndex and next
        const i = expandedIndex;
        const j = i + 1;
        if (j < speedTable.length) {
          const s1 = speedTable[i];
          const s2 = speedTable[j];
          const base = i + 1;               // e.g., 2 for "2.x"
          const t = Math.min(Math.max(valueNum - base, 0), 1); // 0..1
          speedPixelsPerSecond = s1 + (s2 - s1) * t;
        }
        buildButtons();
      };
      return btn;
    }

    // Wake Lock (optional)
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          wakeLock.addEventListener('release', () => {});
        }
      } catch (err) { /* ignore */ }
    }
    document.addEventListener('visibilitychange', () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });

    // init
    window.onload = () => {
      buildButtons();
      startAutoScroll();
      requestWakeLock();
    };
