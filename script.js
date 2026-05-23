const size = 10;
const maxApples = size * size - 2;
const baseTickMs = 430;
const minTickMs = 95;
const speedStepMs = 7;
const bestRecordKey = "snake-10x10-infinite-best";
const languageKey = "snake-10x10-language";

const board = document.querySelector("#board");
const appLayout = document.querySelector(".app-layout");
const scoreEl = document.querySelector("#score");
const lengthEl = document.querySelector("#length");
const speedEl = document.querySelector("#speed");
const messageEl = document.querySelector("#message");
const startBtn = document.querySelector("#start");
const restartBtn = document.querySelector("#restart");
const languageBtn = document.querySelector("#language");
const bestPanel = document.querySelector("#best-panel");
const bestRecordEl = document.querySelector("#best-record");
const difficultyInputs = [...document.querySelectorAll("input[name='difficulty']")];

const translations = {
  zh: {
    title: "10x10 贪吃蛇",
    labelApples: "苹果",
    labelLength: "长度",
    labelSpeed: "速度",
    targetLabel: "获胜目标",
    goal20: "20 个苹果",
    goal50: "50 个苹果",
    goalInfinite: "无限模式",
    start: "开始游戏",
    reset: "重置",
    again: "再来一局",
    languageButton: "English",
    prompt: "选择目标后点击开始",
    wall: "撞到边界，游戏结束",
    self: "撞到自己，游戏结束",
    winInfinite: "胜利！小蛇填满了棋盘",
    winGoal: (count) => `胜利！小蛇吃到了 ${count} 个苹果`,
    scoreInfinite: "无限",
    bestTitle: "无限模式最佳",
    bestUnit: "最多吃到的苹果数",
    speedSlow: "慢",
    speedMedium: "中",
    speedFast: "快",
    speedMax: "极速",
  },
  en: {
    title: "10x10 Snake",
    labelApples: "Apples",
    labelLength: "Length",
    labelSpeed: "Speed",
    targetLabel: "Goal",
    goal20: "20 apples",
    goal50: "50 apples",
    goalInfinite: "Endless",
    start: "Start",
    reset: "Reset",
    again: "Play again",
    languageButton: "中文",
    prompt: "Choose a goal, then start",
    wall: "You hit the wall. Game over",
    self: "You hit yourself. Game over",
    winInfinite: "Victory! The board is full",
    winGoal: (count) => `Victory! You ate ${count} apples`,
    scoreInfinite: "Endless",
    bestTitle: "Endless best",
    bestUnit: "Most apples eaten",
    speedSlow: "Slow",
    speedMedium: "Medium",
    speedFast: "Fast",
    speedMax: "Max",
  },
};

const vectors = {
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 },
  right: { x: 1, y: 0 },
};

const rotations = {
  up: "-90deg",
  left: "180deg",
  down: "90deg",
  right: "0deg",
};

const keyToDir = {
  w: "up",
  a: "left",
  s: "down",
  d: "right",
  arrowup: "up",
  arrowleft: "left",
  arrowdown: "down",
  arrowright: "right",
};

let cells = [];
let snake = [];
let apple = null;
let direction = "right";
let queuedDirection = "right";
let applesEaten = 0;
let targetMode = "20";
let targetApples = 20;
let timer = null;
let keyFlashTimer = null;
let state = "idle";
let lang = localStorage.getItem(languageKey) === "en" ? "en" : "zh";
let bestRecord = Number(localStorage.getItem(bestRecordKey) ?? 0);
let messageKey = "prompt";
let messageValue = null;

function t(key, value) {
  const entry = translations[lang][key];
  return typeof entry === "function" ? entry(value) : entry;
}

function initBoard() {
  board.innerHTML = "";
  cells = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";
      board.appendChild(cell);
      cells.push(cell);
    }
  }
}

function resetGame(showPrompt = true) {
  window.clearTimeout(timer);
  snake = [
    { x: 5, y: 5 },
    { x: 4, y: 5 },
  ];
  direction = "right";
  queuedDirection = "right";
  applesEaten = 0;
  state = "idle";
  readDifficulty();
  placeApple();
  setDifficultyDisabled(false);
  startBtn.disabled = false;
  startBtn.textContent = t("start");
  setMessage("prompt", null, showPrompt);
  updateBestPanel();
  render();
}

function startGame() {
  if (state === "running") {
    return;
  }

  readDifficulty();
  state = "running";
  setDifficultyDisabled(true);
  startBtn.disabled = true;
  messageEl.className = "message";
  messageEl.textContent = "";
  updateBestPanel();
  scheduleNextStep();
}

function scheduleNextStep() {
  window.clearTimeout(timer);
  timer = window.setTimeout(step, currentTickMs());
}

function currentTickMs() {
  return Math.max(minTickMs, baseTickMs - applesEaten * speedStepMs);
}

function readDifficulty() {
  targetMode = difficultyInputs.find((input) => input.checked)?.value ?? "20";
  targetApples = targetMode === "infinite" ? maxApples : Number(targetMode);
  updateBestPanel();
}

function setDifficultyDisabled(disabled) {
  difficultyInputs.forEach((input) => {
    input.disabled = disabled;
  });
}

function placeApple() {
  const occupied = new Set(snake.map(toKey));
  const emptyCells = [];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const point = { x, y };
      if (!occupied.has(toKey(point))) {
        emptyCells.push(point);
      }
    }
  }

  apple = emptyCells.length
    ? emptyCells[Math.floor(Math.random() * emptyCells.length)]
    : null;
}

function step() {
  if (state !== "running") {
    return;
  }

  direction = queuedDirection;
  const head = snake[0];
  const vector = vectors[direction];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };

  if (isWallHit(nextHead)) {
    endGame("wall");
    return;
  }

  const ateApple = apple && nextHead.x === apple.x && nextHead.y === apple.y;
  const bodyToCheck = ateApple ? snake : snake.slice(0, -1);

  if (bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)) {
    endGame("self");
    return;
  }

  snake.unshift(nextHead);

  if (ateApple) {
    applesEaten += 1;
    updateBestRecord();
    if (applesEaten >= targetApples) {
      apple = null;
      render();
      endGame(targetMode === "infinite" ? "winInfinite" : "winGoal", targetApples);
      return;
    }
    placeApple();
  } else {
    snake.pop();
  }

  render();
  scheduleNextStep();
}

function setDirection(nextDirection) {
  if (state !== "running") {
    return;
  }

  const currentVector = vectors[direction];
  const nextVector = vectors[nextDirection];
  const isReverse =
    currentVector.x + nextVector.x === 0 &&
    currentVector.y + nextVector.y === 0;

  if (!isReverse) {
    queuedDirection = nextDirection;
  }
}

function render() {
  cells.forEach((cell) => {
    cell.className = "cell";
    cell.style.removeProperty("--head-rotation");
  });

  if (apple) {
    cells[indexOf(apple)].classList.add("apple");
  }

  snake.forEach((segment, index) => {
    const cell = cells[indexOf(segment)];
    cell.classList.add("snake");
    if (index === 0) {
      cell.classList.add("head");
      cell.style.setProperty("--head-rotation", rotations[direction]);
    }
  });

  const targetText = targetMode === "infinite" ? t("scoreInfinite") : targetApples;
  scoreEl.textContent = `${applesEaten} / ${targetText}`;
  lengthEl.textContent = `${snake.length} / ${size * size}`;
  speedEl.textContent = speedLabel();
  bestRecordEl.textContent = bestRecord;
}

function speedLabel() {
  const tick = currentTickMs();
  if (tick > 330) {
    return t("speedSlow");
  }
  if (tick > 220) {
    return t("speedMedium");
  }
  if (tick > 140) {
    return t("speedFast");
  }
  return t("speedMax");
}

function updateBestRecord() {
  if (targetMode !== "infinite" || applesEaten <= bestRecord) {
    return;
  }

  bestRecord = applesEaten;
  localStorage.setItem(bestRecordKey, String(bestRecord));
  updateBestPanel();
}

function updateBestPanel() {
  const showBestPanel = targetMode === "infinite";
  bestPanel.hidden = !showBestPanel;
  appLayout.classList.toggle("has-record", showBestPanel);
  bestRecordEl.textContent = bestRecord;
}

function setMessage(key, value = null, show = true) {
  messageKey = key;
  messageValue = value;
  messageEl.textContent = show ? t(messageKey, messageValue) : "";
  messageEl.className = show ? "message show" : "message";
}

function endGame(key, value = null) {
  updateBestRecord();
  state = "ended";
  window.clearTimeout(timer);
  setDifficultyDisabled(false);
  startBtn.disabled = false;
  startBtn.textContent = t("again");
  setMessage(key, value, true);
}

function applyLanguage() {
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  languageBtn.textContent = t("languageButton");
  board.setAttribute(
    "aria-label",
    lang === "zh" ? "10乘10贪吃蛇游戏区域" : "10 by 10 snake game board",
  );

  if (messageEl.classList.contains("show")) {
    messageEl.textContent = t(messageKey, messageValue);
  }
  if (state !== "ended") {
    startBtn.textContent = t("start");
  }
  render();
}

function isWallHit(point) {
  return point.x < 0 || point.y < 0 || point.x >= size || point.y >= size;
}

function indexOf(point) {
  return point.y * size + point.x;
}

function toKey(point) {
  return `${point.x},${point.y}`;
}

document.addEventListener("keydown", (event) => {
  const nextDirection = keyToDir[event.key.toLowerCase()];
  if (nextDirection) {
    event.preventDefault();
    flashDirectionButton(nextDirection);
    setDirection(nextDirection);
  }
});

document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => {
    flashDirectionButton(button.dataset.dir);
    setDirection(button.dataset.dir);
  });
});

function flashDirectionButton(directionName) {
  const button = document.querySelector(`[data-dir="${directionName}"]`);
  if (!button) {
    return;
  }

  document.querySelectorAll("[data-dir]").forEach((control) => {
    control.classList.remove("is-active");
  });
  window.clearTimeout(keyFlashTimer);
  button.classList.add("is-active");
  keyFlashTimer = window.setTimeout(() => {
    button.classList.remove("is-active");
  }, 170);
}

difficultyInputs.forEach((input) => {
  input.addEventListener("change", () => {
    readDifficulty();
    render();
  });
});

startBtn.addEventListener("click", () => {
  if (state === "ended") {
    resetGame(false);
  }
  startBtn.textContent = t("start");
  startGame();
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

languageBtn.addEventListener("click", () => {
  lang = lang === "zh" ? "en" : "zh";
  localStorage.setItem(languageKey, lang);
  applyLanguage();
});

initBoard();
resetGame();
applyLanguage();
