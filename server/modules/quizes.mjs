import fs from 'fs/promises';
import { init } from './setup.mjs';

const connect = init();

export async function storeQuiz(quiz) {
  let questionExists;
  let stringChoices;
  for (const question of quiz.questions) {
    const db = await connect;
    stringChoices = question.options.toString();
    questionExists = await db.get(
      'SELECT * FROM Questions WHERE question = ? AND choices= ?', [question.question_title, stringChoices],
    );
    if (questionExists) {
      continue;
    }
    await db.run(
      'INSERT INTO Questions (question, category, choices, answer) VALUES (?, ?, ?, ?)',
      [question.question_title, quiz['quiz-title'], stringChoices, question.correct_ans],
    );
  }
  return true;
}

/**
 * Stores quiz data from a JSON file into a database.
 * @returns {Promise<void>} A promise that resolves when the quiz data is stored.
 */
export async function storeQuizFromJson() {
  const db = await connect;
  const data = await fs.readFile('./server/questions.json', 'utf8');
  const jsonQuestions = JSON.parse(data);
  let questionExists;
  let stringChoices;
  for (const quiz of Object.entries(jsonQuestions)) {
    for (const question of quiz[1].questions) {
      stringChoices = question.options.toString();
      questionExists = await db.get(
        'SELECT * FROM Questions WHERE question = ? AND choices= ?', [question.question_title, stringChoices],
      );
      if (questionExists) {
        continue;
      }
      await db.run(
        'INSERT INTO Questions (question, category, choices, answer) VALUES (?, ?, ?, ?)',
        [question.question_title, quiz[1]['quiz-title'], stringChoices, question.correct_ans],
      );
    }
  }
}

/**
 * Retrieves a specified number of random questions from the database.
 * @param {number} count - The number of random questions to retrieve.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of random questions.
 */

export async function getQuestions() {
  const db = await connect;
  const questions = await db.all('SELECT * FROM Questions');
  return questions;
}
export async function getRandomQuestions(count) {
  const db = await connect;
  const questions = await db.all('SELECT * FROM Questions');
  const randomQuestions = [];
  if (questions.length < count) {
    return questions;
  }
  while (randomQuestions.length < count) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    const randomQuestion = questions[randomIndex];
    if (!randomQuestions.includes(randomQuestion)) {
      randomQuestions.push(randomQuestion);
    }
  }
  return randomQuestions;
}
/**
 * Retrieves a specified number of random questions from a given category.
 *
 * @param {number} count - The number of random questions to retrieve.
 * @param {string} category - The category of questions to retrieve.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of random questions.
 */
export async function getRandomQuestionsFromCategory(count, category) {
  const db = await connect;
  const questions = await db.all('SELECT * FROM Questions WHERE category = ?', [category]);
  if (questions.length < count) {
    return questions;
  }
  const randomQuestions = [];
  while (randomQuestions.length < count) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    const randomQuestion = questions[randomIndex];
    if (!randomQuestions.includes(randomQuestion)) {
      randomQuestions.push(randomQuestion);
    }
  }
  return randomQuestions;
}
