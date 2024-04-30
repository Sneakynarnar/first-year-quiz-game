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
  questionElement.classList.add('question', 'p-4', 'mb-4', 'bg-white', 'rounded', 'shadow-md');

  questionElement.innerHTML = `
    <div class="flex justify-between items-center mb-2">
      <h2 class="text-lg font-semibold">Question ${questionCounter}</h2>
      <button class="delete-question-btn text-red-500 font-semibold">Delete</button>
    </div>
    <input type="text" placeholder="Enter question title" class="question-title block w-full p-2 border border-gray-300 rounded mb-3">
    <div class="grid grid-cols-2 gap-3">
      <div class="flex items-center">
        <input type="text" placeholder="Option 1" class="option block w-full p-2 border border-gray-300 rounded mb-1">
        <input type="radio" name="correct-answer-${questionCounter}" value="1" class="h-4 w-7">
      </div>
      <div class="flex items-center">
        <input type="text" placeholder="Option 2" class="option block w-full p-2 border border-gray-300 rounded mb-1">
        <input type="radio" name="correct-answer-${questionCounter}" value="2" class="h-4 w-7">
      </div>
      <div class="flex items-center">
        <input type="text" placeholder="Option 3" class="option block w-full p-2 border border-gray-300 rounded mb-1">
        <input type="radio" name="correct-answer-${questionCounter}" value="3" class="h-4 w-7">
      </div>
      <div class="flex items-center">
        <input type="text" placeholder="Option 4" class="option block w-full p-2 border border-gray-300 rounded mb-1">
        <input type="radio" name="correct-answer-${questionCounter}" value="4" class="h-4 w-7">
      </div>
    </div>
  `;

  questionContainer.appendChild(questionElement);
  
  const deleteButton = questionElement.querySelector('.delete-question-btn');
  deleteButton.addEventListener('click', () => {
    questionElement.remove();
  });

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
      questionElement.classList.add('question', 'p-4', 'mb-4', 'bg-white', 'rounded', 'shadow-md');
      questionElement.innerHTML = `
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-lg font-semibold">${questionData.question_title}</h2>
          <button class="delete-question-btn text-red-500 font-semibold">Delete</button>
        </div>
        <input type="text" placeholder="Enter question title" class="question-title block w-full p-2 border border-gray-300 rounded mb-3" value="${questionData.question_title}">
        <div class="grid grid-cols-2 gap-3">
          <div class="flex items-center">
            <input type="text" placeholder="Option 1" class="option block w-full p-2 border border-gray-300 rounded mb-1" value="${questionData.options[0]}">
            <input type="radio" name="correct-answer-${questionCounter}" value="1" class="h-4 w-7" ${questionData.correct_ans === 1 ? 'checked' : ''}>
          </div>
          <div class="flex items-center">
            <input type="text" placeholder="Option 2" class="option block w-full p-2 border border-gray-300 rounded mb-1" value="${questionData.options[1]}">
            <input type="radio" name="correct-answer-${questionCounter}" value="2" class="h-4 w-7" ${questionData.correct_ans === 2 ? 'checked' : ''}>
          </div>
          <div class="flex items-center">
            <input type="text" placeholder="Option 3" class="option block w-full p-2 border border-gray-300 rounded mb-1" value="${questionData.options[2]}">
            <input type="radio" name="correct-answer-${questionCounter}" value="3" class="h-4 w-7" ${questionData.correct_ans === 3 ? 'checked' : ''}>
          </div>
          <div class="flex items-center">
            <input type="text" placeholder="Option 4" class="option block w-full p-2 border border-gray-300 rounded mb-1" value="${questionData.options[3]}">
            <input type="radio" name="correct-answer-${questionCounter}" value="4" class="h-4 w-7" ${questionData.correct_ans === 4 ? 'checked' : ''}>
          </div>
        </div>
      `;
      questionContainer.appendChild(questionElement);
      
      const deleteButton = questionElement.querySelector('.delete-question-btn');
      deleteButton.addEventListener('click', () => {
        questionElement.remove();
      });

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