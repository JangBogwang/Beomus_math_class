(() => {
  // ====== 상태 ======
  const state = {
    dans: new Set(),     // 여러 단 선택
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
  const answerForm = document.getElementById("answerForm");
  const answerInput = document.getElementById("answer");

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
    return [...state.dans].sort((a,b)=>a-b).join("-");
  };
  const lsKey = () => 'gugu_unified_ranking';

  function renderSelectionLabel() {
    const arr = [...state.dans].sort((a,b)=>a-b);
    chosenDanEl.textContent = arr.length ? `${arr.join(", ")}단` : "없음";
    renderChips(arr);
    startBtn.disabled = arr.length === 0;
  }

  function renderChips(arr){
    chipsEl.innerHTML = arr.map(d =>
      `<span class="tag" data-d="${d}">${d}단 <span class="x" aria-label="${d}단 해제">&times;</span></span>`
    ).join("");
    chipsEl.querySelectorAll(".tag .x").forEach(x=>{
      x.addEventListener("click", () => {
        const d = Number(x.parentElement.parentElement.dataset.d);
        toggleDan(d);
      });
    });
  }

  function toggleDan(d){
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

  // 문제 생성: (선택된 단 중 하나) × (1~9)
  function nextQuestion() {
    const arr = [...state.dans];
    const a = arr[randInt(0, arr.length - 1)];
    const b = randInt(1, 9);

    // 30% 변형 문제 (빈칸)
    const variant = Math.random();
    let text, ans;

    if (variant < 0.15) {
      text = `? × ${b} = ${a * b}`;
      ans = a;             // 왼쪽 빈칸
    } else if (variant < 0.30) {
      text = `${a} × ? = ${a * b}`;
      ans = b;             // 오른쪽 빈칸
    } else {
      text = `${a} × ${b} = ?`;
      ans = a * b;         // 기본
    }

    state.current = { a, b, ans, text };
    questionEl.textContent = text;
    answerInput.value = "";
    answerInput.focus();
    // 살짝 통통 튀는 효과
    questionEl.parentElement.classList.remove("bouncy");
    void questionEl.parentElement.offsetWidth;
    questionEl.parentElement.classList.add("bouncy");
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

  const characterData = [
      { src: "asset/img/angry.png", name: "화난 범뮤" },
      { src: "asset/img/cowboy.png", name: "카우보이 범뮤" },
      { src: "asset/img/cyborg.png", name: "사이보그 범뮤" },
      { src: "asset/img/normal.png", name: "평범한 범뮤" },
      { src: "asset/img/idol.png", name: "아이돌 범뮤" },
      { src: "asset/img/hanbok.png", name: "한복 범뮤" }
  ];

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

  answerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!state.playing) return;

    const val = Number(answerInput.value);
    if (Number.isNaN(val)) return;

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
      answerInput.value = "";
      // 같은 문제 유지
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
