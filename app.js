let currentQuestionIndex = 0;
let score = 0;
let studentName = '';
let quizData = [];
let selectedQuiz = 'quiz1';

function loadQuizData() {
    const apiUrl = `https://my-json-server.typicode.com/ChessManiac/quiz-test/${selectedQuiz}?nocache=${new Date().getTime()}`;
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            if (data && data.questions) {
                quizData = data.questions.map((q, i) => ({
                    ...q,
                    questionNumber: i + 1,
                    type: q.type || 'multiple-choice'
                }));
                showQuizPage();
                showQuestion();
            } else {
                throw new Error('Quiz data structure is invalid');
            }
        })
        .catch(error => {
            console.error('Error fetching quiz data:', error);
            alert("Failed to load quiz. Please check your connection and try again.");
        });
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('start-form').addEventListener('submit', function(e) {
        e.preventDefault();
        studentName = document.getElementById('student-name').value.trim();
        if (!studentName) {
            alert("Please enter your name");
            return;
        }
        selectedQuiz = document.getElementById('quiz-select').value;
        loadQuizData();
    });

    document.getElementById('retake-btn').addEventListener('click', function() {
        resetQuiz();
    });

    document.getElementById('home-btn').addEventListener('click', function() {
        location.reload();
    });
});

function showQuizPage() {
    document.getElementById('start-view').style.display = 'none';
    document.getElementById('quiz-view').style.display = 'block';
    document.getElementById('end-view').style.display = 'none';
    document.getElementById('quiz-title').innerText = `Quiz: ${studentName}`;
    updateScoreboard();
}

function showQuestion() {
    if (currentQuestionIndex >= quizData.length) {
        showEndPage();
        return;
    }
    
    const question = quizData[currentQuestionIndex];
    let template;
    
    const existingFeedback = document.querySelector('.feedback-message');
    if (existingFeedback) existingFeedback.remove();
    
    if (question.type === 'image-selection') {
        template = Handlebars.compile(document.getElementById('image-question-template').innerHTML);
        document.getElementById('question-container').innerHTML = template(question);
        
        document.querySelectorAll('.image-option-btn').forEach(button => {
            const img = button.querySelector('img');
            
            button.addEventListener('mouseenter', () => {
                img.style.transform = 'scale(1.05)';
                img.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            });
            
            button.addEventListener('mouseleave', () => {
                img.style.transform = 'scale(1)';
                img.style.boxShadow = 'none';
            });
            
            button.addEventListener('click', function() {
                handleImageSelection(this.dataset.answer, this);
            });
        });
    } 
    else if (question.type === 'narrative') {
        template = Handlebars.compile(document.getElementById('narrative-template').innerHTML);
        document.getElementById('question-container').innerHTML = template(question);
        
        document.querySelector('.submit-narrative').addEventListener('click', function() {
            const answer = document.getElementById('narrative-answer').value.trim();
            if (answer) {
                handleNarrativeAnswer(answer);
            } else {
                alert("Please enter your answer before submitting");
            }
        });
    }
    else {
        template = Handlebars.compile(document.getElementById('question-template').innerHTML);
        document.getElementById('question-container').innerHTML = template(question);
        
        document.querySelectorAll('.answer-btn').forEach(button => {
            button.addEventListener('click', function() {
                handleAnswer(this.dataset.answer, this);
            });
        });
    }
}

function updateScoreboard() {
    document.getElementById('scoreboard').innerHTML = `
        <div class="card">
            <div class="card-body">
                <p><strong>Score:</strong> ${score}</p>
                <p><strong>Question:</strong> ${currentQuestionIndex + 1}/${quizData.length}</p>
            </div>
        </div>
    `;
}

function handleAnswer(selectedAnswer, selectedButton) {
    const currentQuestion = quizData[currentQuestionIndex];
    const correctAnswer = currentQuestion.correctAnswer;
    
    document.querySelectorAll('.answer-btn').forEach(button => {
        button.disabled = true;
        
        if (button.dataset.answer === correctAnswer) {
            button.classList.add('correct-answer');
        }
        
        if (button === selectedButton && selectedAnswer !== correctAnswer) {
            button.classList.add('selected-wrong');
        }
    });
    
    const feedback = document.createElement('div');
    feedback.classList.add('feedback-message', 'mt-3', 'p-3', 'rounded');
    
    if (selectedAnswer === correctAnswer) {
        feedback.innerHTML = `<p class="text-success"><strong>✓ Correct!</strong> Well done!</p>`;
        feedback.classList.add('bg-success-light');
        score++;
        selectedButton.classList.add('selected-correct');
    } else {
        feedback.innerHTML = `
            <p class="text-danger"><strong>✗ Incorrect</strong></p>
            <p class="text-muted">The correct answer was: <strong>${correctAnswer}</strong></p>
        `;
        feedback.classList.add('bg-danger-light');
    }
    
    const nextButton = document.createElement('button');
    nextButton.textContent = currentQuestionIndex < quizData.length - 1 ? 'Next Question' : 'See Results';
    nextButton.classList.add('btn', 'btn-primary', 'mt-2');
    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            showQuestion();
            updateScoreboard();
        } else {
            showEndPage();
        }
    });
    
    feedback.appendChild(nextButton);
    document.getElementById('question-container').appendChild(feedback);
}

function handleImageSelection(selectedIndex, selectedButton) {
    const currentQuestion = quizData[currentQuestionIndex];
    const correctIndex = currentQuestion.correctAnswer;
    const imgElement = selectedButton.querySelector('img');
    
    document.querySelectorAll('.image-option-btn').forEach(button => {
        button.disabled = true;
        button.style.cursor = 'default';
        
        if (button.dataset.answer === correctIndex) {
            button.querySelector('img').classList.add('correct-answer');
        }
    });
    
    imgElement.classList.add(
        selectedIndex === correctIndex ? 'selected-correct' : 'selected-wrong'
    );
    
    const feedback = document.createElement('div');
    feedback.classList.add('feedback-message', 'mt-3', 'p-3', 'rounded');
    
    if (selectedIndex === correctIndex) {
        feedback.innerHTML = `<p class="text-success"><strong>✓ Correct!</strong> Great selection!</p>`;
        feedback.classList.add('bg-success-light');
        score++;
    } else {
        feedback.innerHTML = `
            <p class="text-danger"><strong>✗ Incorrect</strong></p>
            <p class="text-muted">The correct image was: <strong>Option ${parseInt(correctIndex) + 1}</strong></p>
        `;
        feedback.classList.add('bg-danger-light');
    }
    
    const nextButton = document.createElement('button');
    nextButton.textContent = currentQuestionIndex < quizData.length - 1 ? 'Next Question' : 'See Results';
    nextButton.classList.add('btn', 'btn-primary', 'mt-2');
    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            showQuestion();
            updateScoreboard();
        } else {
            showEndPage();
        }
    });
    
    feedback.appendChild(nextButton);
    document.getElementById('question-container').appendChild(feedback);
}

function handleNarrativeAnswer(answer) {
    quizData[currentQuestionIndex].userAnswer = answer;
    
    const feedback = document.createElement('div');
    feedback.classList.add('feedback-message', 'mt-3', 'p-3', 'rounded', 'bg-info-light');
    feedback.innerHTML = `<p class="text-info">Response submitted!</p>`;
    
    const nextButton = document.createElement('button');
    nextButton.textContent = currentQuestionIndex < quizData.length - 1 ? 'Next Question' : 'See Results';
    nextButton.classList.add('btn', 'btn-primary', 'mt-2');
    nextButton.addEventListener('click', () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            showQuestion();
            updateScoreboard();
        } else {
            showEndPage();
        }
    });
    
    feedback.appendChild(nextButton);
    document.getElementById('question-container').appendChild(feedback);
    
    document.getElementById('narrative-answer').disabled = true;
    document.querySelector('.submit-narrative').disabled = true;
}

function showEndPage() {
    document.getElementById('quiz-view').style.display = 'none';
    document.getElementById('end-view').style.display = 'block';

    let percentage = Math.round((score / quizData.length) * 100);
    let message = percentage >= 80 ? 
        `Congratulations ${studentName}! You passed the quiz with ${score}/${quizData.length} (${percentage}%) correct answers.` : 
        `Sorry ${studentName}, you scored ${score}/${quizData.length} (${percentage}%). Please try again!`;
    document.getElementById('end-message').innerText = message;
}

function resetQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById('end-view').style.display = 'none';
    showQuizPage();
    showQuestion();
}