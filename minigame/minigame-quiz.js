document.addEventListener('DOMContentLoaded', () => {
    const questionEl = document.getElementById('question');
    const correctBtn = document.getElementById('correct-btn');
    const incorrectBtn = document.getElementById('incorrect-btn');
    const warrior = document.getElementById('warrior');
    const demon = document.getElementById('demon');
    const bgm = document.getElementById('bgm');

    let isEquationCorrect;

    function generateQuestion() {
        const num1 = Math.floor(Math.random() * 9) + 1;
        const num2 = Math.floor(Math.random() * 9) + 1;
        const realAnswer = num1 * num2;
        
        // 50% chance to show a fake answer
        if (Math.random() > 0.5) {
            isEquationCorrect = true;
            questionEl.textContent = `${num1} × ${num2} = ${realAnswer}`;
        } else {
            isEquationCorrect = false;
            let fakeAnswer;
            do {
                // Generate a fake answer that is not the real answer
                const offset = Math.floor(Math.random() * 5) + 1;
                fakeAnswer = realAnswer + (Math.random() > 0.5 ? offset : -offset);
            } while (fakeAnswer === realAnswer || fakeAnswer <= 0);
            questionEl.textContent = `${num1} × ${num2} = ${fakeAnswer}`;
        }
    }

    function handleAnswer(userChoseCorrect) {
        // Correct answer is when the user correctly identifies if the equation is right or wrong
        if (userChoseCorrect === isEquationCorrect) {
            // User is right, attack demon
            demon.classList.add('attacked');
            setTimeout(() => {
                demon.classList.remove('attacked');
                generateQuestion();
            }, 500);
        } else {
            // User is wrong, attack warrior
            warrior.classList.add('attacked');
            setTimeout(() => {
                warrior.classList.remove('attacked');
                generateQuestion();
            }, 500);
        }
    }

    correctBtn.addEventListener('click', () => handleAnswer(true));
    incorrectBtn.addEventListener('click', () => handleAnswer(false));

    // Play BGM on user interaction
    document.body.addEventListener('click', () => {
        if (bgm.paused) {
            bgm.play().catch(e => console.error("Audio play failed:", e));
        }
    }, { once: true });

    generateQuestion();
});
