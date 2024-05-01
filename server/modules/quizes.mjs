import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { init } from './setup.mjs';

const connect = init();

export async function storeQuiz(quiz) {
  const [quizName, quizQuestions] = Object.entries(quiz)[0]; // Destructure the quiz object
  const questionsObject = { 'quiz-title': quizName, 'questions': quizQuestions };
  let questionExists;
  let stringChoices;
  for (const question of questionsObject.questions) {
    const db = await connect;
    stringChoices = question.choices.toString();
    questionExists = await db.get(
      'SELECT * FROM Questions WHERE question = ? AND choices= ?', [question.question_title, stringChoices],
    );
    if (questionExists) {
      continue;
    }
    await db.run(
      'INSERT INTO Questions (question, category, choices, answer) VALUES (?, ?, ?, ?)',
      [question.question_title, questionsObject['quiz-title'], stringChoices, question.answer],
    );
  }
  return true;
}


export async function storeQuizFromJson() {
  const db = await connect;
  const jsonQuestions = fs.readFile('./questions.json', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    return JSON.parse(data);
  });
  let questionExists;
  let stringChoices;
  for (const quiz of Object.entries(jsonQuestions)) {
    for (const question of quiz.questions) {
      stringChoices = question.choices.toString();
      questionExists = await db.get(
        'SELECT * FROM Questions WHERE question = ? AND choices= ?', [question.question_title, stringChoices],
      );
      if (questionExists) {
        continue;
      }
      await db.run(
        'INSERT INTO Questions (question, category, choices, answer) VALUES (?, ?, ?, ?)',
        [question.question_title, quiz['quiz-title'], stringChoices, question.answer],
      );
    }
  }
}

module.exports = { storeQuizFromJson };
