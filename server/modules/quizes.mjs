import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export function createQuiz(req, res) {
  const quiz = req.body; // The quiz object should be in the format { 'quiz-name': { 'question': 'answer' } }
  console.log('Received quiz: ', quiz);
  const [quizName, quizQuestions] = Object.entries(quiz)[0]; // Destructure the quiz object
  console.log('THESE ARE THE ENTRIES', Object.entries(quiz));
  fs.readFile('./questions.json', (err, data) => { //
    if (err) {
      console.error(err);
      return;
    }
    const questions = JSON.parse(data); //
    const quizId = uuidv4(); // Generate a unique ID for the quiz
    // console.log(quizName);
    questions[quizId] = { 'quiz-title': quizName, 'questions': quizQuestions }; //
    fs.writeFile('./questions.json', JSON.stringify(questions), (err) => {
      if (err) {
        console.error(err);
        return;
      }
      res.json({ id: quizId }); // Send the quiz ID back to the client
    });
  });
}
