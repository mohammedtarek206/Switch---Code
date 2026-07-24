'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft, FiLoader } from 'react-icons/fi';

export default function TakeExam() {
    const params = useParams();
    const router = useRouter();
    const [exam, setExam] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const token = localStorage.getItem('token');
                // Use the dedicated single exam API
                const res = await fetch(`/api/exams/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setExam(data);
                    setTimeLeft(data.duration * 60);
                    setAnswers(new Array(data.questions.length).fill(-1));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [params.id]);

    useEffect(() => {
        if (timeLeft > 0 && !result && !loading) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && exam && !result && !loading) {
            handleSubmit();
        }
    }, [timeLeft, result, loading, exam]);

    const handleAnswer = (optionIdx: number) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = optionIdx;
        setAnswers(newAnswers);
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/exams/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ examId: exam._id, answers }),
            });
            const data = await res.json();
            if (res.ok) setResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-dark flex flex-col items-center justify-center space-y-4">
            <FiLoader className="text-primary animate-spin" size={40} />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Preparing Examination...</p>
        </div>
    );

    if (!exam) return (
        <div className="min-h-screen bg-dark flex items-center justify-center">
            <p className="text-red-500">Exam not found or failed to load.</p>
        </div>
    );

    if (result) return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass w-full max-w-lg p-12 rounded-[3.5rem] border border-white/5 text-center space-y-8"
            >
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${result.status === 'Pass' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {result.status === 'Pass' ? <FiCheckCircle size={48} /> : <FiXCircle size={48} />}
                </div>
                <div>
                    <h2 className="text-4xl font-black tracking-tighter mb-2">{result.status === 'Pass' ? 'CONGRATULATIONS!' : 'KEEP PUSHING!'}</h2>
                    <p className="text-gray-500 font-medium">You scored {result.score}% on <span className="text-white">{exam.title}</span></p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Pass Score</p>
                        <p className="text-xl font-bold">{exam.passScore}%</p>
                    </div>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Your Score</p>
                        <p className={`text-xl font-bold ${result.status === 'Pass' ? 'text-green-500' : 'text-red-500'}`}>{result.score}%</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl"
                >
                    Back to Dashboard
                </button>
            </motion.div>
        </div>
    );

    const q = exam.questions[currentQuestion];
    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <div className="min-h-screen bg-dark text-white pt-32 pb-20 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="flex justify-between items-end mb-12">
                    <div className="space-y-1 text-right" dir="rtl">
                        <h1 className="text-4xl font-black italic tracking-tighter">{exam.title}</h1>
                        <p className="text-xs text-gray-500 uppercase font-black tracking-widest">Question {currentQuestion + 1} / {exam.questions.length}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className={`p-4 rounded-2xl border flex items-center font-black text-xl tracking-tighter transition-colors ${timeLeft < 60 ? 'border-red-500/50 text-red-500 bg-red-500/10 animate-pulse' : 'border-white/5 bg-white/5 text-white'}`}>
                            <FiClock className="mr-3" /> {formatTime(timeLeft)}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/5 rounded-full mb-12 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestion + 1) / exam.questions.length) * 100}%` }}
                        className="h-full bg-primary"
                    ></motion.div>
                </div>

                {/* Question Area */}
                <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass p-12 rounded-[3.5rem] border border-white/5 space-y-12"
                >
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold leading-relaxed">{q.text}</h2>
                    </div>

                    <div className="grid gap-4">
                        {q.options.map((opt: string, idx: number) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                className={`p-6 rounded-2xl text-left font-bold transition-all border flex items-center group ${answers[currentQuestion] === idx
                                        ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                                    }`}
                            >
                                <span className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 text-xs font-black transition-colors ${answers[currentQuestion] === idx ? 'bg-white text-black' : 'bg-white/5 text-gray-500'
                                    }`}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                {opt}
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-white/5">
                        <button
                            disabled={currentQuestion === 0}
                            onClick={() => setCurrentQuestion(prev => prev - 1)}
                            className="flex items-center text-xs font-bold text-gray-600 hover:text-white transition-all disabled:opacity-0"
                        >
                            <FiArrowLeft className="mr-2" /> PREVIOUS
                        </button>

                        {currentQuestion === exam.questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || answers.includes(-1)}
                                className="bg-accent text-dark px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/10 disabled:opacity-50"
                            >
                                {submitting ? 'Submitting...' : 'Complete & Finish'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestion(prev => prev + 1)}
                                className="flex items-center text-xs font-bold text-primary hover:text-accent transition-all group"
                            >
                                NEXT QUESTION <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
