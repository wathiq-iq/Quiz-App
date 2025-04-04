import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useSound from 'use-sound';
import successSound from './success.mp3';
import errorSound from './error.mp3';
import finishSound from './finish.mp3';

const QuizApp = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [animateAnswer, setAnimateAnswer] = useState(false);
  const [isNextVisible, setIsNextVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [numQuestions, setNumQuestions] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  const [playSuccess] = useSound(successSound);
  const [playError] = useSound(errorSound);
  const [playFinish] = useSound(finishSound);

  const shuffleArray = (array) => {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch('./questions.json');
      let data = await response.json();
      data = shuffleArray(data);
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  useEffect(() => {
    fetchQuestions();
    const savedLeaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    setLeaderboard(savedLeaderboard);
  }, []);

  const startQuiz = () => {
    if (!numQuestions || numQuestions <= 0 || numQuestions > questions.length) {
      alert("يرجى اختيار عدد صحيح من الأسئلة!");
      return;
    }
    const shuffled = shuffleArray(questions).slice(0, numQuestions);
    setSelectedQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setFeedback(null);
    setAnimateAnswer(false);
    setIsNextVisible(false);
  };

  const handleAnswer = (answer) => {
    const isCorrect = answer === selectedQuestions[currentIndex].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
      playSuccess();
    } else {
      playError();
    }

    setFeedback({ correct: isCorrect, correctAnswer: selectedQuestions[currentIndex].correctAnswer });
    setAnimateAnswer(true);
    setIsNextVisible(true);
  };

  const goToNextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < selectedQuestions.length) {
      setCurrentIndex(nextIndex);
      setFeedback(null);
      setAnimateAnswer(false);
      setIsNextVisible(false);
    } else {
      saveScore();
      playFinish();
      setShowResult(true);
    }
  };

  const saveScore = () => {
    const username = prompt("أدخل اسمك");
    const newLeaderboard = [...leaderboard, { name: username, score }];
    newLeaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem('leaderboard', JSON.stringify(newLeaderboard.slice(0, 5)));
    setLeaderboard(newLeaderboard.slice(0, 5));
  };

  if (!selectedQuestions.length) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">اختر عدد الأسئلة</h2>
        <p className="mb-4">إجمالي عدد الأسئلة المتاحة: {questions.length}</p>
        <input
          type="number"
          className="border p-2"
          value={numQuestions || ''}
          onChange={(e) => setNumQuestions(parseInt(e.target.value))}
        />
        <button
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          onClick={startQuiz}
        >
          بدء الاختبار
        </button>
      </div>
    );
  }

  if (showResult) {
    const message = score === selectedQuestions.length
      ? '🎉 أداء رائع! لقد أجبت على جميع الأسئلة بشكل صحيح 👏'
      : score >= selectedQuestions.length / 2
        ? '💪 عمل جيد! واصل التعلم والمثابرة'
        : '✨ لا تيأس، كل محاولة تقربك من النجاح';

    return (
      <motion.div
        className="p-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ background: score === selectedQuestions.length ? '#d1fae5' : '#fef3c7' }}
      >
        <h2 className="text-2xl font-bold mb-4">انتهى الاختبار!</h2>
        <p className="text-lg font-bold text-green-600">درجتك: {score} من {selectedQuestions.length}</p>
        <p className="text-md mt-2 text-blue-600 animate-bounce">{message}</p>
        <button
          className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          onClick={startQuiz}
        >
          ابدأ من جديد
        </button>
      </motion.div>
    );
  }

  const currentQuestion = selectedQuestions[currentIndex];

  return (
    <motion.div
      className="p-4 text-center"
      animate={animateAnswer ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] } : {}}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-xl font-semibold mb-2">الأسئلة العامة</h2>
      <p className="mb-4">{currentQuestion.question}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {currentQuestion.options.map((option, idx) => (
          <motion.button
            key={idx}
            className={`py-2 px-4 rounded font-medium shadow-md transition transform hover:scale-105 ${feedback ? 'cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}
            onClick={() => handleAnswer(option)}
            disabled={!!feedback}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
          >
            {option}
          </motion.button>
        ))}
      </div>
      {feedback && (
        <motion.div
          className={`mt-2 font-bold ${feedback.correct ? 'text-green-700' : 'text-red-700'}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1.1, opacity: 1 }}
        >
          {feedback.correct ? "✔️ إجابة صحيحة!" : `❌ إجابة خاطئة! الإجابة الصحيحة هي: ${feedback.correctAnswer}`}
        </motion.div>
      )}
      <p className="text-sm mt-2">السؤال {currentIndex + 1} من {selectedQuestions.length}</p>
      {isNextVisible && (
        <motion.button
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          onClick={goToNextQuestion}
          whileTap={{ scale: 0.95 }}
        >
          السؤال التالي
        </motion.button>
      )}
    </motion.div>
  );
};

export default QuizApp;
