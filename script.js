let allData = [];
let currentQuestions = [];
let currentIndex = 0;
let userScore = 0;
let timer = null;
let secondsLeft = 30;

// Load questions on startup
fetch("questions.json")
  .then((res) => res.json())
  .then((data) => {
    allData = data;
    renderTopics();
    updateDashboardStats();
  });

function renderTopics() {
  const container = document.getElementById("topicsContainer");
  container.innerHTML = "";
  allData.forEach((topic, idx) => {
    const card = document.createElement("div");
    card.className = "topic-card";
    card.innerHTML = `
      <h3>${topic.category}</h3>
      <p style="color:#6b7280; font-size: 0.85rem; margin-top: 4px;">${topic.questions.length} Questions</p>
    `;
    card.onclick = () => startQuiz(idx);
    container.appendChild(card);
  });
}

function startQuiz(topicIndex) {
  currentQuestions = allData[topicIndex].questions;
  document.getElementById("quizTopicTitle").innerText = allData[topicIndex].category;
  currentIndex = 0;
  userScore = 0;
  document.getElementById("quizModal").classList.remove("hidden");
  loadQuestion();
}

function loadQuestion() {
  clearInterval(timer);
  secondsLeft = 30;
  document.getElementById("timeLeft").innerText = secondsLeft;
  document.getElementById("feedbackBox").classList.add("hidden");
  document.getElementById("nextBtn").classList.add("hidden");

  const q = currentQuestions[currentIndex];
  document.getElementById("questionText").innerText = `${currentIndex + 1}. ${q.question}`;
  document.getElementById("questionCounter").innerText = `Q ${currentIndex + 1}/${currentQuestions.length}`;

  const container = document.getElementById("optionsList");
  container.innerHTML = "";

  q.options.forEach((optText, i) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerText = optText;
    btn.onclick = () => selectAnswer(i);
    container.appendChild(btn);
  });

  // Start 30s countdown
  timer = setInterval(() => {
    secondsLeft--;
    document.getElementById("timeLeft").innerText = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(timer);
      selectAnswer(-1); // timeout
    }
  }, 1000);
}

function selectAnswer(selectedIndex) {
  clearInterval(timer);
  const q = currentQuestions[currentIndex];
  const buttons = document.querySelectorAll(".option-btn");

  buttons.forEach((b) => (b.disabled = true));

  if (selectedIndex === q.answer) {
    userScore++;
    if (buttons[selectedIndex]) buttons[selectedIndex].classList.add("correct");
  } else {
    if (buttons[selectedIndex]) buttons[selectedIndex].classList.add("wrong");
    if (buttons[q.answer]) buttons[q.answer].classList.add("correct");
  }

  // Show PSC explanation
  const feedback = document.getElementById("feedbackBox");
  feedback.classList.remove("hidden");
  feedback.innerHTML = `<strong>Note:</strong> ${q.explanation || "No explanation available."}`;

  const nextBtn = document.getElementById("nextBtn");
  nextBtn.classList.remove("hidden");
  if (currentIndex + 1 >= currentQuestions.length) {
    nextBtn.innerText = "Finish Quiz";
  } else {
    nextBtn.innerText = "Next Question →";
  }
}

document.getElementById("nextBtn").onclick = () => {
  if (currentIndex + 1 < currentQuestions.length) {
    currentIndex++;
    loadQuestion();
  } else {
    finishQuiz();
  }
};

document.getElementById("closeQuizBtn").onclick = () => {
  clearInterval(timer);
  document.getElementById("quizModal").classList.add("hidden");
};

function finishQuiz() {
  const percentage = Math.round((userScore / currentQuestions.length) * 100);
  alert(`Quiz Completed!\nYour Score: ${userScore}/${currentQuestions.length} (${percentage}%)`);

  // Save student progress locally
  const history = JSON.parse(localStorage.getItem("psc_progress") || "[]");
  history.push({
    score: percentage,
    date: new Date().toLocaleDateString(),
    medal: percentage >= 80 ? 1 : 0
  });
  localStorage.setItem("psc_progress", JSON.stringify(history));

  document.getElementById("quizModal").classList.add("hidden");
  updateDashboardStats();
}

function updateDashboardStats() {
  const history = JSON.parse(localStorage.getItem("psc_progress") || "[]");
  if (!history.length) return;

  const totalAttempts = history.length;
  const bestScore = Math.max(...history.map((h) => h.score));
  const medals = history.filter((h) => h.medal > 0).length;

  document.getElementById("bestScore").innerText = `${bestScore}%`;
  document.getElementById("totalAttempts").innerText = totalAttempts;
  document.getElementById("medalsCount").innerText = `${medals} 🏅`;
}