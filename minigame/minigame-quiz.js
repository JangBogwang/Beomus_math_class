(function () {
    // ===== DOM Elements =====
    const questionEl    = document.getElementById('question');
    const correctBtn    = document.getElementById('correct-btn');
    const incorrectBtn  = document.getElementById('incorrect-btn');
    const warrior       = document.getElementById('warrior');
    const demon         = document.getElementById('demon');
    const bgm           = document.getElementById('bgm');
    const timerEl       = document.getElementById('timer');
    const warriorHpEl   = document.getElementById('warrior-hp');
    const demonHpEl     = document.getElementById('demon-hp');
    const endScreen     = document.getElementById('end-screen');
    const endMessageEl  = document.getElementById('end-message');

    // ===== Game State =====
    const INITIAL_WARRIOR_HP = 3;
    const INITIAL_DEMON_HP   = 25;
    const INITIAL_TIME       = 60;

    let isEquationCorrect = false;
    let warriorHp = INITIAL_WARRIOR_HP;
    let demonHp   = INITIAL_DEMON_HP;
    let timeLeft  = INITIAL_TIME;
    let timerId   = null;
    let gameEnded = false;

    // ===== 초기화 진입점 =====
    function init() {
        // 버튼 이벤트: 한 번만 바인딩
        if (correctBtn && incorrectBtn) {
            correctBtn.addEventListener('click', () => handleAnswer(true));
            incorrectBtn.addEventListener('click', () => handleAnswer(false));
        }

        // BGM: 유저 첫 클릭 때만 플레이
        if (bgm) {
            const playBgm = () => {
                if (bgm.paused) {
                    bgm.play().catch(err => console.error('BGM play error:', err));
                }
                document.body.removeEventListener('click', playBgm);
            };
            document.body.addEventListener('click', playBgm, { once: true });
        }

        // 게임 시작
        startGame();
    }

    // ===== 게임 시작 =====
    function startGame() {
        // 상태 초기화
        gameEnded = false;
        warriorHp = INITIAL_WARRIOR_HP;
        demonHp   = INITIAL_DEMON_HP;
        timeLeft  = INITIAL_TIME;

        // UI 초기화
        if (endScreen) {
            endScreen.classList.add('hidden');
            endScreen.style.display = 'none';   // 혹시 모를 CSS 충돌 대비
        }
        showGameElements(true);
        updateHpDisplay();
        updateTimerDisplay();

        // 문제 생성 + 타이머 시작
        generateQuestion();
        startTimer();
    }

    // ===== HP / 타이머 표시 =====
    function updateHpDisplay() {
        if (warriorHpEl) warriorHpEl.textContent = `${warriorHp} / ${INITIAL_WARRIOR_HP}`;
        if (demonHpEl)   demonHpEl.textContent   = `${demonHp} / ${INITIAL_DEMON_HP}`;
    }

    function updateTimerDisplay() {
        if (timerEl) timerEl.textContent = `Time: ${timeLeft}`;
    }

    function startTimer() {
        if (timerId) clearInterval(timerId);

        // 항상 새 게임 타이머로 세팅
        timeLeft = INITIAL_TIME;
        updateTimerDisplay();

        timerId = setInterval(() => {
            if (gameEnded) {
                clearInterval(timerId);
                return;
            }

            timeLeft--;
            if (timeLeft < 0) timeLeft = 0;
            updateTimerDisplay();

            if (timeLeft <= 0) {
                clearInterval(timerId);
                endGame(false);
            }
        }, 1000);
    }

    // ===== 문제 생성 (O/X 구구단) =====
    function generateQuestion() {
        if (gameEnded || !questionEl) return;

        const num1 = Math.floor(Math.random() * 9) + 1;
        const num2 = Math.floor(Math.random() * 9) + 1;
        const realAnswer = num1 * num2;

        // 50% 확률로 정답 / 오답 출제
        if (Math.random() > 0.5) {
            isEquationCorrect = true;
            questionEl.textContent = `${num1} × ${num2} = ${realAnswer}`;
        } else {
            isEquationCorrect = false;
            let fakeAnswer;
            do {
                const offset = Math.floor(Math.random() * 5) + 1; // 1~5 차이
                fakeAnswer = realAnswer + (Math.random() > 0.5 ? offset : -offset);
            } while (fakeAnswer === realAnswer || fakeAnswer <= 0);

            questionEl.textContent = `${num1} × ${num2} = ${fakeAnswer}`;
        }
    }

    // ===== 정답 처리 =====
    function handleAnswer(userChoseCorrect) {
        if (gameEnded) return;

        if (userChoseCorrect === isEquationCorrect) {
            // 정답 → 악마 피해
            demonHp--;
            if (demon) {
                demon.classList.add('attacked');
                setTimeout(() => demon.classList.remove('attacked'), 400);
            }

            if (demonHp <= 0) {
                demonHp = 0;
                updateHpDisplay();
                endGame(true);
                return;
            }
        } else {
            // 오답 → 기사 피해
            warriorHp--;
            if (warrior) {
                warrior.classList.add('attacked');
                setTimeout(() => warrior.classList.remove('attacked'), 400);
            }

            if (warriorHp <= 0) {
                warriorHp = 0;
                updateHpDisplay();
                endGame(false);
                return;
            }
        }

        updateHpDisplay();
        if (!gameEnded) {
            generateQuestion();
        }
    }

    // ===== 게임 종료 =====
    function endGame(didWin) {
        if (gameEnded) return;
        gameEnded = true;

        if (timerId) clearInterval(timerId);
        if (bgm) bgm.pause();

        if (endMessageEl) {
            endMessageEl.textContent = didWin ? '✨ 성공! ✨' : '실패...';
        }

        if (endScreen) {
            endScreen.classList.remove('hidden');
            endScreen.style.display = 'flex';   // 항상 보이도록 직접 지정
        }

        showGameElements(false);
    }

    // ===== UI 토글 =====
    function showGameElements(show) {
        const elements = [
            document.querySelector('.question-card'),
            document.getElementById('buttons-container'),
        ];
        elements.forEach(el => {
            if (!el) return;
            el.style.display = show ? 'block' : 'none';
        });
    }

    // ===== DOM 로딩 상태에 따라 init 실행 =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
