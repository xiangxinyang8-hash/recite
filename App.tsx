import React, { useState, useCallback } from 'react';
import { VocabularyLevel, LoadingState, QuizState, WordItem } from './types';
import { fetchWordBatch } from './services/geminiService';
import { Button } from './components/Button';
import { QuizCard } from './components/QuizCard';

const INITIAL_QUIZ_STATE: QuizState = {
  currentWordIndex: 0,
  words: [],
  score: 0,
  totalAnswered: 0,
  streak: 0,
  isFinished: false,
};

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [selectedLevel, setSelectedLevel] = useState<VocabularyLevel>(VocabularyLevel.CET6);
  const [quizState, setQuizState] = useState<QuizState>(INITIAL_QUIZ_STATE);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const startGame = async (level: VocabularyLevel) => {
    setLoadingState(LoadingState.LOADING);
    setSelectedLevel(level);
    setErrorMsg('');

    try {
      const words = await fetchWordBatch(level, 5); // Fetch 5 words at a time
      setQuizState({
        ...INITIAL_QUIZ_STATE,
        words: words,
      });
      setLoadingState(LoadingState.READY);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to generate vocabulary. Please check your connection or API key.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleNextWord = (wasCorrect: boolean) => {
    setQuizState(prev => {
      const isLastWord = prev.currentWordIndex >= prev.words.length - 1;
      
      if (isLastWord) {
        return {
          ...prev,
          score: wasCorrect ? prev.score + 1 : prev.score,
          totalAnswered: prev.totalAnswered + 1,
          streak: wasCorrect ? prev.streak + 1 : 0,
          isFinished: true,
        };
      }

      return {
        ...prev,
        score: wasCorrect ? prev.score + 1 : prev.score,
        totalAnswered: prev.totalAnswered + 1,
        streak: wasCorrect ? prev.streak + 1 : 0,
        currentWordIndex: prev.currentWordIndex + 1,
      };
    });
  };

  const resetGame = () => {
    setLoadingState(LoadingState.IDLE);
    setQuizState(INITIAL_QUIZ_STATE);
  };

  // --- Renders ---

  const renderHeader = () => (
    <header className="flex items-center justify-between py-6 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          L
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">LexiQuest AI</h1>
      </div>
      {loadingState === LoadingState.READY && !quizState.isFinished && (
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm text-slate-600">
             🔥 Streak: <span className="text-orange-500 font-bold">{quizState.streak}</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm text-slate-600">
             Score: <span className="text-indigo-600 font-bold">{quizState.score}/{quizState.words.length}</span>
          </div>
        </div>
      )}
    </header>
  );

  const renderHome = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Master Vocabulary with <span className="text-indigo-600">AI</span>
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Select your target exam and let Gemini generate challenging words, verify your meanings, and track your progress.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <button 
            onClick={() => startGame(VocabularyLevel.CET6)}
            disabled={loadingState === LoadingState.LOADING}
            className="group relative flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300"
          >
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">🎓</span>
            <span className="text-lg font-bold text-slate-800">CET-6</span>
            <span className="text-sm text-slate-400 mt-1">College English Test Band 6</span>
          </button>
          
          <button 
            onClick={() => startGame(VocabularyLevel.KAOYAN)}
            disabled={loadingState === LoadingState.LOADING}
            className="group relative flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300"
          >
            <span className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📚</span>
            <span className="text-lg font-bold text-slate-800">Kaoyan</span>
            <span className="text-sm text-slate-400 mt-1">Postgraduate Entrance Exam</span>
          </button>
        </div>

        {loadingState === LoadingState.LOADING && (
          <div className="flex items-center justify-center gap-3 text-indigo-600 animate-pulse">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-medium">Curating your word list with Gemini...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );

  const renderGame = () => {
    const currentWord = quizState.words[quizState.currentWordIndex];
    if (!currentWord) return null;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="mb-6 flex justify-between items-end px-2">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              {selectedLevel}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              Word {quizState.currentWordIndex + 1} of {quizState.words.length}
            </span>
          </div>
          
          <QuizCard 
            wordData={currentWord} 
            onNext={handleNextWord}
            isLast={quizState.currentWordIndex === quizState.words.length - 1}
          />
        </div>
      </div>
    );
  };

  const renderResult = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in-up">
      <div className="glass-panel p-12 rounded-3xl text-center max-w-lg w-full shadow-xl">
        <div className="text-6xl mb-6">🏆</div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Session Complete!</h2>
        <p className="text-slate-500 mb-8">Great job practicing today.</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-indigo-50 rounded-xl">
            <div className="text-3xl font-bold text-indigo-600">{quizState.score}</div>
            <div className="text-xs uppercase tracking-wide text-indigo-400 font-semibold">Correct</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="text-3xl font-bold text-purple-600">{Math.round((quizState.score / quizState.words.length) * 100)}%</div>
            <div className="text-xs uppercase tracking-wide text-purple-400 font-semibold">Accuracy</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={resetGame} variant="secondary">Back to Menu</Button>
          <Button onClick={() => startGame(selectedLevel)}>Play Again</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {renderHeader()}
      
      <main className="flex-1 flex flex-col">
        {loadingState === LoadingState.IDLE || loadingState === LoadingState.LOADING || loadingState === LoadingState.ERROR ? (
          renderHome()
        ) : quizState.isFinished ? (
          renderResult()
        ) : (
          renderGame()
        )}
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm">
        Powered by Google Gemini • React • TypeScript
      </footer>
    </div>
  );
};

export default App;