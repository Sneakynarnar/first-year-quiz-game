const questionContainer = document.querySelector('#questionContainer');
const addQuestionButton = document.querySelector('#add-question-button');
const submitQuestionsButton = document.querySelector('#submit-quiz-button');
const downloadQuestionsTemplateButton = document.querySelector('#download-quiz-template-button');
const quizTitleText = document.querySelector('#quiz-title');
const quizFileInput = document.querySelector('#quiz-template-upload');
const uploadQuizButton = document.querySelector('#upload-quiz-template-button')
let questionCounter = 1;
function addQuestion() {
  const questionElement = document.createElement('div');
  questionElement.classList.add('question');
  questionElement.innerHTML = `
    <h2>Question ${questionCounter}</h2>
    <input type="text" placeholder="Enter question title" class="question-title">
    <input type="text" placeholder="Option 1" class="option">
    <input type="text" placeholder="Option 2" class="option">
    <input type="text" placeholder="Option 3" class="option">
    <input type="text" placeholder="Option 4" class="option">
    <input type="radio" name="correct-answer-${questionCounter}" value="1">
    <input type="radio" name="correct-answer-${questionCounter}" value="2">
    <input type="radio" name="correct-answer-${questionCounter}" value="3">
    <input type="radio" name="correct-answer-${questionCounter}" value="4">
  `;
  questionContainer.appendChild(questionElement);
  questionCounter++;
}
function jsonifyQuestions() {
  const questions = [];
  const questionElements = document.querySelectorAll('.question');
  const quizTitle = quizTitleText.value;
  questionElements.forEach(questionElement => {
    const questionTitle = questionElement.querySelector('.question-title').value;
    const options = questionElement.querySelectorAll('.option');
    const correctAnswer = questionElement.querySelector('input[type="radio"]:checked').value;
    if (correctAnswer === undefined) {
      alert('Please select a correct answer for each question'); // feel free to add a more user-friendly alert
      return;
    }
    const question = {
      question_title: questionTitle,
      options: Array.from(options).map(option => option.value),
      correct_ans: Number(correctAnswer),
    };
    questions.push(question);
  });
  return { [quizTitle]: questions };
}


function unjsonifyQuestions() {
  const fileInput = quizFileInput;
  const file = fileInput.files[0];
  if (!file) {
    alert('No file uploaded'); // add more user friendly error message
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    const jsonData = event.target.result;
    const parsedData = JSON.parse(jsonData);
    const quizTitle = Object.keys(parsedData)[0];
    const questions = parsedData[quizTitle];
    questions.forEach((questionData) => {
      const questionElement = document.createElement('div');
      questionElement.classList.add('question');
      questionElement.innerHTML = `
        <h2>${questionData.question_title}</h2>
        <input type="text" placeholder="Enter question title" class="question-title" value="${questionData.question_title}">
        <input type="text" placeholder="Option 1" class="option" value="${questionData.options[0]}">
        <input type="text" placeholder="Option 2" class="option" value="${questionData.options[1]}">
        <input type="text" placeholder="Option 3" class="option" value="${questionData.options[2]}">
        <input type="text" placeholder="Option 4" class="option" value="${questionData.options[3]}">
        <input type="radio" name="correct-answer-${questionCounter}" value="1" ${questionData.correct_ans === 1 ? 'checked' : ''}>
        <input type="radio" name="correct-answer-${questionCounter}" value="2" ${questionData.correct_ans === 2 ? 'checked' : ''}>
        <input type="radio" name="correct-answer-${questionCounter}" value="3" ${questionData.correct_ans === 3 ? 'checked' : ''}>
        <input type="radio" name="correct-answer-${questionCounter}" value="4" ${questionData.correct_ans === 4 ? 'checked' : ''}>
      `;

      questionContainer.appendChild(questionElement);
      questionCounter++;
    });
  };

  reader.readAsText(file);
}

function downloadQuestions() {
  const formattedQuestions = jsonifyQuestions();
  const blob = new Blob([JSON.stringify(formattedQuestions)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${quizTitleText.value}.json`; // may break with special characters in the quiz title (e.g. /, \, etc.) add a regex to replace those characters
  a.click();
  URL.revokeObjectURL(url);
}
async function submitQuestions() {
  const formattedQuestions = jsonifyQuestions();
  await fetch('/api/createquiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedQuestions),
  });
}
function main() {
  addQuestion();
}
addQuestionButton.addEventListener('click', addQuestion);
submitQuestionsButton.addEventListener('click', submitQuestions);
downloadQuestionsTemplateButton.addEventListener('click', downloadQuestions);
uploadQuizButton.addEventListener('click', unjsonifyQuestions);
main();
