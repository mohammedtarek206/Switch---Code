'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCheckSquare, FiClock, FiAward, FiAlertCircle, FiRefreshCw,
    FiArrowLeft, FiTarget, FiX, FiChevronRight, FiCheck,
    FiAlertTriangle, FiLock
} from 'react-icons/fi';
import Link from 'next/link';

interface Quiz {
    _id: string;
    title: string;
    description: string;
    duration: number;
    passingScore: number;
    attemptsAllowed: number;
    questions: QuizQuestion[];
    order: number;
    totalAttempts: number;
    bestAttempt?: {
        score: number;
        percentage: number;
        passed: boolean;
        submittedAt: string;
        attemptNumber: number;
    } | null;
    canAttempt: boolean;
}

interface QuizQuestion {
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    points: number;
}

interface QuizResult {
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    attemptNumber: number;
}

export default function QuizzesPage() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [noTrack, setNoTrack] = useState(false);

    // Quiz taking state
    const [activeQuiz, setActiveQuiz] = useState<any>(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);
    const [resultMessage, setResultMessage] = useState('');

    useEffect(() => {
        fetchQuizzes();
    }, []);

    // Timer
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((t) => {
                if (t !== null && t <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return t !== null ? t - 1 : null;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const fetchQuizzes = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lms/quizzes', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (!res.ok) throw new Error('err');
            const data = await res.json();
            if (data.noTrack) { setNoTrack(true); return; }
            setQuizzes(data.quizzes || []);
        } catch {
            setError('حدث خطأ أثناء تحميل الاختبارات');
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = async (quizId: string, duration: number) => {
        setQuizLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/lms/quizzes/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Cannot start quiz');
                return;
            }
            const data = await res.json();
            setActiveQuiz(data.quiz);
            setAnswers({});
            setResult(null);
            setResultMessage('');
            setTimeLeft(duration * 60);
        } catch {
            alert('Failed to load quiz');
        } finally {
            setQuizLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!activeQuiz) return;
        setSubmitting(true);
        setTimeLeft(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lms/quizzes/submit', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ quizId: activeQuiz._id, answers }),
            });
            const data = await res.json();
            if (res.ok) {
                setResult(data.attempt);
                setResultMessage(data.message);
                fetchQuizzes(); // Refresh list
            } else {
                alert(data.error || 'Failed to submit');
            }
        } catch {
            alert('Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-400 font-medium">Loading Quizzes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <p className="text-gray-300">{error}</p>
                    <button onClick={fetchQuizzes} className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl font-bold text-sm">
                        <FiRefreshCw className="w-4 h-4" /> Retry
                    </button>
                </div>
            </div>
        );
    }

    if (noTrack) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-md">
                    <FiTarget className="w-16 h-16 text-gray-600 mx-auto" />
                    <h2 className="text-xl font-bold text-white">No Track Selected</h2>
                    <p className="text-gray-400">Please select a track to access quizzes.</p>
                    <Link href="/learn" className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl font-bold text-sm">
                        <FiTarget className="w-4 h-4" /> Choose Track
                    </Link>
                </div>
            </div>
        );
    }

    const passed = quizzes.filter(q => q.bestAttempt?.passed).length;

    return (
        <div className="min-h-screen bg-[#07111F] text-white py-10 px-4 md:px-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <Link href="/learn" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3 transition-colors">
                        <FiArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold flex items-center gap-3">
                                <FiCheckSquare className="text-yellow-400" /> Quizzes
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">{passed} / {quizzes.length} quizzes passed</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                <span className="text-yellow-400 font-bold">{quizzes.length > 0 ? Math.round((passed / quizzes.length) * 100) : 0}%</span>
                                <span className="text-gray-500 text-xs ml-1">Passed</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Empty */}
                {quizzes.length === 0 && (
                    <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
                        <FiCheckSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">No Quizzes Available</h2>
                        <p className="text-gray-400">No quizzes available for your track yet.</p>
                    </div>
                )}

                {/* Quiz Cards */}
                <div className="space-y-4">
                    {quizzes.map((quiz, idx) => (
                        <motion.div
                            key={quiz._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`bg-white/[0.02] rounded-2xl border p-6 transition-all ${quiz.bestAttempt?.passed ? 'border-green-500/20' :
                                    !quiz.canAttempt ? 'border-red-500/20 opacity-75' : 'border-white/5'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-white text-lg">{quiz.title}</h3>
                                        {quiz.bestAttempt?.passed && (
                                            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <FiCheck className="w-3 h-3" /> Passed
                                            </span>
                                        )}
                                        {!quiz.canAttempt && !quiz.bestAttempt?.passed && (
                                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                                                <FiLock className="w-3 h-3" /> Max Attempts
                                            </span>
                                        )}
                                    </div>
                                    {quiz.description && (
                                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{quiz.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <FiClock className="w-3 h-3" /> {quiz.duration} min
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FiAward className="w-3 h-3" /> Pass: {quiz.passingScore}%
                                        </span>
                                        <span>{quiz.questions.length} Questions</span>
                                        <span>{quiz.totalAttempts} / {quiz.attemptsAllowed} Attempts Used</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 shrink-0">
                                    {quiz.bestAttempt && (
                                        <div className="text-right">
                                            <p className={`text-xl font-extrabold ${quiz.bestAttempt.passed ? 'text-green-400' : 'text-red-400'}`}>
                                                {quiz.bestAttempt.percentage}%
                                            </p>
                                            <p className="text-[10px] text-gray-500">Best Score</p>
                                        </div>
                                    )}
                                    {quiz.canAttempt && (
                                        <button
                                            onClick={() => startQuiz(quiz._id, quiz.duration)}
                                            disabled={quizLoading}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl font-bold text-sm hover:bg-yellow-500/20 transition-all disabled:opacity-50"
                                        >
                                            {quiz.bestAttempt ? 'Retry Quiz' : 'Start Quiz'}
                                            <FiChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Quiz Taking Modal */}
            <AnimatePresence>
                {activeQuiz && (
                    <div className="fixed inset-0 z-50 bg-[#07111F] overflow-y-auto">
                        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                            {/* Quiz Header */}
                            <div className="flex items-center justify-between sticky top-0 bg-[#07111F] py-4 border-b border-white/5 z-10">
                                <div>
                                    <h2 className="font-bold text-white text-xl">{activeQuiz.title}</h2>
                                    <p className="text-gray-400 text-sm">{Object.keys(answers).length}/{activeQuiz.questions.length} answered</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {timeLeft !== null && timeLeft > 0 && (
                                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border ${timeLeft < 60 ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                                            }`}>
                                            <FiClock className="w-4 h-4" />
                                            {formatTime(timeLeft)}
                                        </div>
                                    )}
                                    <button onClick={() => { setActiveQuiz(null); setResult(null); setTimeLeft(null); }} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white">
                                        <FiX className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Result Panel */}
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`p-8 rounded-3xl border text-center ${result.passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                                        }`}
                                >
                                    <div className={`text-6xl font-extrabold mb-2 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                        {result.percentage}%
                                    </div>
                                    <h3 className={`text-2xl font-bold mb-2 ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
                                        {result.passed ? '🎉 Congratulations! You Passed!' : '❌ You Did Not Pass'}
                                    </h3>
                                    <p className="text-gray-400 mb-1">{resultMessage}</p>
                                    <p className="text-gray-500 text-sm">Score: {result.score} / {result.maxScore} • Attempt #{result.attemptNumber}</p>
                                    <div className="flex justify-center gap-4 mt-6">
                                        <button
                                            onClick={() => { setActiveQuiz(null); setResult(null); setTimeLeft(null); }}
                                            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                                        >
                                            Back to Quizzes
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Questions */}
                            {!result && activeQuiz.questions.map((q: QuizQuestion, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="bg-white/[0.02] rounded-2xl border border-white/5 p-6"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <span className="w-8 h-8 bg-yellow-500/10 text-yellow-400 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-bold text-white text-base leading-snug">{q.question}</p>
                                            <p className="text-xs text-gray-500 mt-1">{q.points} point{q.points > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>

                                    {q.type === 'multiple_choice' && q.options && (
                                        <div className="space-y-2 ml-11">
                                            {q.options.map((opt, oi) => (
                                                <button
                                                    key={oi}
                                                    onClick={() => setAnswers(prev => ({ ...prev, [idx]: opt }))}
                                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${answers[idx] === opt
                                                            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                                                            : 'bg-white/[0.02] border-white/5 text-gray-300 hover:border-yellow-500/20 hover:bg-yellow-500/5'
                                                        }`}
                                                >
                                                    <span className="font-bold text-yellow-400/60 mr-2">{String.fromCharCode(65 + oi)}.</span>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'true_false' && (
                                        <div className="flex gap-3 ml-11">
                                            {['True', 'False'].map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setAnswers(prev => ({ ...prev, [idx]: opt }))}
                                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${answers[idx] === opt
                                                            ? opt === 'True' ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'
                                                            : 'bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/5'
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'short_answer' && (
                                        <textarea
                                            value={answers[idx] || ''}
                                            onChange={(e) => setAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                                            placeholder="Type your answer here..."
                                            className="w-full ml-11 bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-yellow-500/30 resize-none h-20"
                                        />
                                    )}
                                </motion.div>
                            ))}

                            {/* Submit Button */}
                            {!result && (
                                <div className="sticky bottom-0 py-4 bg-[#07111F] border-t border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-gray-400 text-sm">
                                            {Object.keys(answers).length}/{activeQuiz.questions.length} questions answered
                                        </span>
                                        {Object.keys(answers).length < activeQuiz.questions.length && (
                                            <span className="text-yellow-400 text-xs flex items-center gap-1">
                                                <FiAlertTriangle className="w-3 h-3" /> Some questions unanswered
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-extrabold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Quiz'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
