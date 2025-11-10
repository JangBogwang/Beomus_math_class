(() => {
  // ====== 상태 ======
  const state = {
    dans: new Set(),
    time: 60,
    score: 0,
    combo: 0,
    playing: false,
    timerId: null,
    current: { a: null, b: null, ans: null, text: "" },
  };

  // ====== 엘리먼트 ======
  const chosenDanEl = document.getElementById("chosenDan");
  const startBtn = document.getElementById("startBtn");
  const clearBtn = document.getElementById("clearBtn");
  const gamePanel = document.getElementById("game-panel");
  const selectPanel = document.getElementById("select-panel");
  const resultPanel = document.getElementById("result-panel");

  const timeLeftEl = document.getElementById("timeLeft");
  const timeBar = document.getElementById("timeBar");
  const scoreEl = document.getElementById("score");
  const comboEl = document.getElementById("combo");
  const questionEl = document.getElementById("question");
  const feedbackEl = document.getElementById("feedback");
  const choicesEl = document.getElementById("choices");

  const chipsEl = document.getElementById("chips");

  const resultSetEl = document.getElementById("resultSet");
  const resultScoreEl = document.getElementById("resultScore");
  const bestScoreEl = document.getElementById("bestScore");
  const bestTableBody = document.getElementById("bestTableBody");
  const retryBtn = document.getElementById("retryBtn");
  const changeDanBtn = document.getElementById("changeDanBtn");

  // ====== 유틸 ======
  const comboKey = () => {
    if (state.dans.size === 0) return "";
    return [...state.dans].sort((a, b) => a - b).join("-");
  };
  const lsKey = () => 'gugu_unified_ranking';

  function renderSelectionLabel() {
    const arr = [...state.dans].sort((a, b) => a - b);
    chosenDanEl.textContent = arr.length ? `${arr.join(", ")}단` : "없음";
    renderChips(arr);
    startBtn.disabled = arr.length === 0;
  }

  function renderChips(arr) {
    chipsEl.innerHTML = arr.map(d =>
      `<span class="tag" data-d="${d}">${d}단 <span class="x" aria-label="${d}단 해제">&times;</span></span>`
    ).join("");
    chipsEl.querySelectorAll(".tag .x").forEach(x => {
      x.addEventListener("click", () => {
        const d = Number(x.parentElement.parentElement.dataset.d);
        toggleDan(d);
      });
    });
  }

  function toggleDan(d) {
    const btn = document.querySelector(`.dan-btn[data-dan="${d}"]`);
    if (state.dans.has(d)) {
      state.dans.delete(d);
      btn.classList.remove("active");
    } else {
      state.dans.add(d);
      btn.classList.add("active");
    }
    renderSelectionLabel();
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function nextQuestion() {
    const arr = [...state.dans];
    const a = arr[randInt(0, arr.length - 1)];
    const b = randInt(1, 9);

    const variant = Math.random();
    let text, ans;

    if (variant < 0.15) {
      text = `? × ${b} = ${a * b}`;
      ans = a;
    } else if (variant < 0.30) {
      text = `${a} × ? = ${a * b}`;
      ans = b;
    } else {
      text = `${a} × ${b} = ?`;
      ans = a * b;
    }

    state.current = { a, b, ans, text };
    questionEl.textContent = text;

    const choices = new Set([ans]);
    while (choices.size < 4) {
      const wrongAns = ans + randInt(-5, 5);
      if (wrongAns !== ans && wrongAns > 0) {
        choices.add(wrongAns);
      }
    }
    renderChoices(shuffle([...choices]));

    questionEl.parentElement.classList.remove("bouncy");
    void questionEl.parentElement.offsetWidth;
    questionEl.parentElement.classList.add("bouncy");
  }

  function renderChoices(choices) {
    choicesEl.innerHTML = choices.map(c =>
      `<button class="choice-btn" data-answer="${c}">${c}</button>`
    ).join("");
  }

  function updateHUD() {
    timeLeftEl.textContent = String(state.time);
    scoreEl.textContent = String(state.score);
    comboEl.textContent = `x${Math.max(state.combo, 1)}`;
    timeBar.style.width = `${(state.time / 60) * 100}%`;
  }

  function addScore(base = 10) {
    const multiplier = Math.max(state.combo, 1);
    const bonus = Math.max(0, state.dans.size - 1);
    state.score += (base + bonus) * multiplier;
  }

  function wrongPenalty() {
    state.combo = 0;
    state.time = Math.max(0, state.time - 3);
  }

  function endGame() {
    state.playing = false;
    clearInterval(state.timerId);

    const keyStr = comboKey();
    resultSetEl.textContent = keyStr ? keyStr : "-";
    resultScoreEl.textContent = state.score;

    // 통합 랭킹 갱신
    const key = lsKey();
    const rankings = JSON.parse(localStorage.getItem(key) || "[]");

    rankings.push({ score: state.score, combo: keyStr || "-" });
    rankings.sort((a, b) => b.score - a.score);
    const top10 = rankings.slice(0, 10);

    localStorage.setItem(key, JSON.stringify(top10));

    const bestScore = top10.length > 0 ? top10[0].score : 0;
    bestScoreEl.textContent = String(bestScore);

    renderBestTable();

    // Set random character image and name
    const resultCharacterEl = document.getElementById("result-character");
    const resultCharacterNameEl = document.getElementById("result-character-name");
    const randomCharacter = characterData[Math.floor(Math.random() * characterData.length)];
    resultCharacterEl.src = randomCharacter.src;
    resultCharacterNameEl.textContent = randomCharacter.name;

    gamePanel.classList.add("hidden");
    selectPanel.classList.add("hidden");
    resultPanel.classList.remove("hidden");
  }

  function renderBestTable() {
    const key = lsKey();
    const rankings = JSON.parse(localStorage.getItem(key) || "[]");

    if (rankings.length === 0) {
      bestTableBody.innerHTML = `<tr><td colspan="2">기록이 없어요</td></tr>`;
      return;
    }

    bestTableBody.innerHTML = rankings
      .map(({ score, combo }) => `<tr><td>${combo}</td><td>${score}</td></tr>`)
      .join("");
  }

  function startGame() {
    if (state.dans.size === 0) return;

    state.time = 60;
    state.score = 0;
    state.combo = 0;
    state.playing = true;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";

    selectPanel.classList.add("hidden");
    resultPanel.classList.add("hidden");
    gamePanel.classList.remove("hidden");

    updateHUD();
    nextQuestion();

    clearInterval(state.timerId);
    state.timerId = setInterval(() => {
      if (!state.playing) return;
      state.time -= 1;
      updateHUD();
      if (state.time <= 0) endGame();
    }, 1000);
  }

  // ====== 이벤트 ======
  document.querySelectorAll(".dan-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = Number(btn.dataset.dan);
      toggleDan(d);
    });
  });

  startBtn.addEventListener("click", startGame);
  clearBtn.addEventListener("click", () => {
    state.dans.clear();
    document.querySelectorAll(".dan-btn").forEach(b => b.classList.remove("active"));
    renderSelectionLabel();
  });

  choicesEl.addEventListener("click", (e) => {
    if (!state.playing || !e.target.matches(".choice-btn")) return;

    const val = Number(e.target.dataset.answer);

    if (val === state.current.ans) {
      state.combo += 1;
      addScore(10);
      const bonus = Math.max(0, state.dans.size - 1);
      const scoreGained = (10 + bonus) * Math.max(state.combo, 1);
      feedbackEl.textContent = `정답! +${scoreGained}점`;
      feedbackEl.className = "feedback ok";
      if (state.combo === 5 || state.combo === 10) {
        state.time = Math.min(60, state.time + 1);
      }
      nextQuestion();
    } else {
      feedbackEl.textContent = `오답!`;
      feedbackEl.className = "feedback no";
      wrongPenalty();
      nextQuestion(); // 오답이어도 다음 문제로
    }
    updateHUD();
  });

  retryBtn.addEventListener("click", () => {
    startGame();
  });

  changeDanBtn.addEventListener("click", () => {
    state.playing = false;
    clearInterval(state.timerId);
    gamePanel.classList.add("hidden");
    resultPanel.classList.add("hidden");
    selectPanel.classList.remove("hidden");
  });

  // 초기 렌더
  renderSelectionLabel();
  renderBestTable();
})();