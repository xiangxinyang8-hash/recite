import React, { useState, useEffect, useRef } from 'react';
import { WordItem, CheckResult } from '../types';
import { Button } from './Button';
import { smartCheckAnswer } from '../services/geminiService';

interface QuizCardProps {
  wordData: WordItem;
  onNext: (wasCorrect: boolean) => void;
  isLast: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({ wordData, onNext, isLast }) => {
  const [input, setInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset state when word changes
    setInput('');
    setResult(null);
    setIsChecking(false);
    inputRef.current?.focus();
  }, [wordData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsChecking(true);

    try {
      // 1. First attempt: Cheap local check (exact or substring match)
      const normalizedInput = input.trim();
      const localMatch = wordData.meanings.some(m => 
        m.includes(normalizedInput) || normalizedInput.includes(m)
      );

      if (localMatch) {
        setResult({ isCorrect: true, userAnswer: normalizedInput, explanation: "Correct!" });
      } else {
        // 2. Second attempt: AI check for semantic validity
        const aiResult = await smartCheckAnswer(wordData.word, wordData.meanings, normalizedInput);
        setResult({ 
          isCorrect: aiResult.isCorrect, 
          userAnswer: normalizedInput, 
          explanation: aiResult.explanation 
        });
      }
    } catch (error) {
      // Fallback if AI fails
      setResult({ isCorrect: false, userAnswer: input, explanation: "Verification error. Try again." });
    } finally {
      setIsChecking(false);
    }
  };

  const handleContinue = () => {
    if (result) {
      onNext(result.isCorrect);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-panel rounded-3xl p-8 md:p-12 shadow-2xl shadow-indigo-100/50 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0 pointer-events-none"></div>

        <div className="relative z-10">
          {/* Word Display */}
          <div className="text-center mb-10">
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-4">
              {wordData.word}
            </h2>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 font-mono text-lg">
              {wordData.phonetic}
            </div>
          </div>

          {!result ? (
            /* Input Phase */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-500 uppercase tracking-wider text-center">
                  Translate to Chinese
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type meaning..."
                  className="block w-full text-center text-2xl p-4 border-b-2 border-slate-200 bg-transparent focus:border-indigo-600 focus:outline-none transition-colors placeholder-slate-300"
                  autoComplete="off"
                />
              </div>
              <div className="flex justify-center pt-4">
                <Button 
                  type="submit" 
                  disabled={!input.trim()} 
                  isLoading={isChecking}
                  className="w-full md:w-auto min-w-[200px]"
                >
                  Check Answer
                </Button>
              </div>
            </form>
          ) : (
            /* Result Phase */
            <div className="animate-fade-in-up">
              <div className={`rounded-xl p-6 mb-8 text-center border ${result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`text-2xl font-bold mb-2 ${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {result.isCorrect ? '🎉 Correct!' : '🤔 Incorrect'}
                </div>
                {result.explanation && (
                  <p className={`text-sm ${result.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {result.explanation}
                  </p>
                )}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <div className="bg-white/50 p-4 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Definitions</h4>
                    <div className="flex flex-wrap gap-2">
                      {wordData.meanings.map((m, i) => (
                        <span key={i} className="px-2 py-1 bg-white rounded border border-slate-200 text-slate-700 text-sm">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/50 p-4 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Example</h4>
                    <p className="text-slate-800 italic mb-1">"{wordData.example}"</p>
                    <p className="text-slate-500 text-sm">{wordData.exampleTranslation}</p>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button onClick={handleContinue} className="w-full md:w-auto min-w-[200px]">
                    {isLast ? 'Finish Quiz' : 'Next Word →'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};