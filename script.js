const speedTable = [
  0.5, 26, 28, 30, 32, 36, 40, 44, 46, 48,
  50, 52, 54, 56, 58, 60, 62, 64, 66, 68,
  70, 72, 74, 78, 80, 81, 82, 83, 84, 85, 86
];

const mainIndices = [0, 5, 10, 15, 20, 25, 30];
const mainLabels  = ["1x","2x","3x","4x","5x","6x","7x"];

const controls = document.getElementById("controls");

let currentMain = 0;
let expanded = null;
let speed = speedTable[0];

let lastTime = null;
let rafId = null;
let accumulator = 0;
let wakeLock = null;

function scrollLoop(t) {
  if (!lastTime) lastTime = t;

  const dt = (t - lastTime) / 1000;
  lastTime = t;

  accumulator += speed * dt;
  const px = Math.floor(accumulator);

  if (px) {
    window.scrollBy(0, px);
    accumulator -= px;
  }

  rafId = requestAnimationFrame(scrollLoop);
}

function startScroll() {
  cancelAnimationFrame(rafId);
  lastTime = null;
  accumulator = 0;
  rafId = requestAnimationFrame(scrollLoop);
}

function makeButton(text, onClick, active = false) {
  const btn = document.createElement("button");
  btn.textContent = text;
  if (active) btn.classList.add("active");
  btn.onclick = onClick;
  return btn;
}

function setSpeedFromMain(idx) {
  currentMain = idx;
  speed = speedTable[mainIndices[idx]];
  accumulator = 0;
}

function buildButtons() {
  controls.innerHTML = "";

  // collapsed
  if (expanded === null) {
    mainLabels.forEach((l, i) =>
      controls.appendChild(
        makeButton(l, () => onMainClick(i), i === currentMain)
      )
    );
    return;
  }

  if (expanded === mainLabels.length - 1) {
    mainLabels.forEach((l, i) =>
      controls.appendChild(
        makeButton(l, () => onMainClick(i), i === expanded)
      )
    );
    return;
  }

  const prev = expanded - 1;
  const next = expanded + 1;

  if (prev >= 0)
    controls.appendChild(makeButton(mainLabels[prev], () => onMainClick(prev)));

  controls.appendChild(
    makeButton(mainLabels[expanded], () => onMainClick(expanded), true)
  );

  generateFineButtons(expanded).forEach(({ label, value }) =>
    controls.appendChild(
      makeButton(label, () => {
        speed = value;
        currentMain = -1;
        accumulator = 0;
        highlight(event.target);
      })
    )
  );

  controls.appendChild(
    makeButton(mainLabels[next], () => onMainClick(next))
  );
}

function onMainClick(idx) {
  expanded = expanded === idx ? null : idx;
  setSpeedFromMain(idx);
  buildButtons();
}

// -------------------------------------------------
// FINE SPEEDS (0.2x)
// -------------------------------------------------

function generateFineButtons(mainIdx) {
  const i1 = mainIndices[mainIdx];
  const i2 = mainIndices[mainIdx + 1];

  const s1 = speedTable[i1];
  const s2 = speedTable[i2];
  const baseX = mainIdx + 1;

  return [1,2,3,4].map(i => ({
    label: `${(baseX + i * 0.2).toFixed(1)}x`,
    value: s1 + (s2 - s1) * (i * 0.2)
  }));
}

function highlight(activeBtn) {
  document.querySelectorAll("#controls button")
    .forEach(b => b.classList.toggle("active", b === activeBtn));
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
  } catch {}
}

document.addEventListener("visibilitychange", () => {
  if (wakeLock && document.visibilityState === "visible") requestWakeLock();
});

window.onload = () => {
  buildButtons();
  startScroll();
  requestWakeLock();
};
