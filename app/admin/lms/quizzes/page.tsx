'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiX, FiList, FiBarChart2 } from 'react-icons/fi';

interface Track { _id: string; name: string }
interface Quiz {
    _id: string;
    title: string;
    duration: number;
    passingScore: number;
    attemptsAllowed: number;
    status: string;
    questions: any[];
    trackId: { _id: string; name: string } | string;
    submissionCount: number;
    avgPercentage: number;
}
interface Question { question: string; type: string; options: string[]; correctAnswer: string; points: number }

const emptyQuestion: Question = { question: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 };
const emptyForm = { title: '', description: '', trackId: '', duration: 30, passingScore: 60, attemptsAllowed: 3, status: 'published', order: 0, questions: [] as Question[] };

export default function AdminLMSQuizzes() {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Quiz | null>(null);
    const [formData, setFormData] = useState<any>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const h = { Authorization: `Bearer ${token}` };
        try {
            const [qRes, tRes] = await Promise.all([fetch('/api/lms/quizzes/admin', { headers: h }), fetch('/api/lms/tracks/admin', { headers: h })]);
            const qData = await qRes.json();
            const tData = await tRes.json();
            setQuizzes(qData.quizzes || []);
            setTracks(tData.tracks || []);
        } catch { }
        finally { setLoading(false); }
    };

    const openCreate = () => { setModalError(null); setEditing(null); setFormData({ ...emptyForm, questions: [] }); setShowModal(true); };
    const openEdit = (q: Quiz) => {
        setModalError(null);
        setEditing(q);
        setFormData({ title: q.title, description: '', trackId: typeof q.trackId === 'object' ? q.trackId._id : q.trackId, duration: q.duration, passingScore: q.passingScore, attemptsAllowed: q.attemptsAllowed, status: q.status, order: 0, questions: q.questions || [] });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);
        if (formData.questions.length === 0) { setModalError('Add at least one question'); return; }
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const url = editing ? `/api/lms/quizzes/${editing._id}` : '/api/lms/quizzes';
            const method = editing ? 'PATCH' : 'POST';
            const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (res.ok) { setShowModal(false); fetchAll(); }
            else { setModalError(data.error || 'Failed to save quiz'); }
        } catch (err: any) { setModalError(err.message || 'Network error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this quiz?')) return;
        const token = localStorage.getItem('token');
        await fetch(`/api/lms/quizzes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        fetchAll();
    };

    const addQuestion = () => setFormData((f: any) => ({ ...f, questions: [...f.questions, { ...emptyQuestion, options: ['', '', '', ''] }] }));
    const removeQuestion = (i: number) => setFormData((f: any) => ({ ...f, questions: f.questions.filter((_: any, idx: number) => idx !== i) }));

    const updateQuestion = (i: number, field: string, value: any) => {
        setFormData((f: any) => {
            const qs = [...f.questions];
            qs[i] = { ...qs[i], [field]: value };
            return { ...f, questions: qs };
        });
    };

    const updateOption = (qi: number, oi: number, value: string) => {
        setFormData((f: any) => {
            const qs = [...f.questions];
            const opts = [...(qs[qi].options || [])];
            opts[oi] = value;
            qs[qi] = { ...qs[qi], options: opts };
            return { ...f, questions: qs };
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Quizzes</h1>
                    <p className="text-gray-400 text-sm mt-1">{quizzes.length} total quizzes</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-600/80 text-white rounded-xl font-bold text-sm">
                    <FiPlus className="w-4 h-4" /> Create Quiz
                </button>
            </div>

            <div className="bg-[#0B1220] rounded-2xl border border-blue-500/20 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[650px]">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {['Quiz', 'Track', 'Questions', 'Pass %', 'Attempts', 'Submissions', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-500">Loading...</td></tr>
                        ) : quizzes.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-500">No quizzes yet</td></tr>
                        ) : (
                            quizzes.map(q => (
                                <tr key={q._id} className="hover:bg-white/[0.02]">
                                    <td className="px-4 py-4">
                                        <p className="font-bold text-white text-sm">{q.title}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${q.status === 'published' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>{q.status}</span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-400">{typeof q.trackId === 'object' ? q.trackId.name : '-'}</td>
                                    <td className="px-4 py-4 text-sm text-white font-bold">{q.questions.length}</td>
                                    <td className="px-4 py-4 text-sm text-yellow-400 font-bold">{q.passingScore}%</td>
                                    <td className="px-4 py-4 text-sm text-gray-400">{q.attemptsAllowed}x</td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <FiBarChart2 className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm text-white font-bold">{q.submissionCount}</span>
                                            {q.submissionCount > 0 && <span className="text-xs text-gray-500">avg {q.avgPercentage}%</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(q)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg"><FiEdit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(q._id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><FiTrash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Quiz Creation Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1220] w-full max-w-3xl rounded-3xl p-8 border border-blue-500/30 my-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">{editing ? 'Edit Quiz' : 'Create Quiz'}</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-gray-400"><FiX className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSave} className="space-y-6">
                                {modalError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                                        {modalError}
                                    </div>
                                )}
                                {/* Basic Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Quiz Title *</label>
                                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Quiz title" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Track *</label>
                                        <select required value={formData.trackId} onChange={e => setFormData({ ...formData, trackId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30">
                                            <option value="" className="bg-gray-900">Select Track</option>
                                            {tracks.map(t => <option key={t._id} value={t._id} className="bg-gray-900">{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Status</label>
                                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30">
                                            <option value="published" className="bg-gray-900">Published</option>
                                            <option value="draft" className="bg-gray-900">Draft</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Duration (min)</label>
                                        <input type="number" value={formData.duration} onChange={e => setFormData({ ...formData, duration: +e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Passing Score (%)</label>
                                        <input type="number" value={formData.passingScore} onChange={e => setFormData({ ...formData, passingScore: +e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Attempts Allowed</label>
                                        <input type="number" value={formData.attemptsAllowed} onChange={e => setFormData({ ...formData, attemptsAllowed: +e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
                                    </div>
                                </div>

                                {/* Questions */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-white flex items-center gap-2"><FiList className="text-blue-400" /> Questions ({formData.questions.length})</h3>
                                        <button type="button" onClick={addQuestion} className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl font-bold text-xs hover:bg-blue-500/20 transition-all">
                                            <FiPlus className="w-3.5 h-3.5" /> Add Question
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.questions.map((q: Question, qi: number) => (
                                            <div key={qi} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 relative">
                                                <button type="button" onClick={() => removeQuestion(qi)} className="absolute right-4 top-4 text-red-400 hover:text-red-300">
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full text-xs flex items-center justify-center font-bold">{qi + 1}</span>
                                                    <select value={q.type} onChange={e => updateQuestion(qi, 'type', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs outline-none">
                                                        <option value="multiple_choice" className="bg-gray-900">Multiple Choice</option>
                                                        <option value="true_false" className="bg-gray-900">True / False</option>
                                                        <option value="short_answer" className="bg-gray-900">Short Answer</option>
                                                    </select>
                                                    <input type="number" value={q.points} onChange={e => updateQuestion(qi, 'points', +e.target.value)} className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none" placeholder="Pts" />
                                                </div>
                                                <input value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} required placeholder="Question text..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none mb-3" />

                                                {q.type === 'multiple_choice' && (
                                                    <div className="space-y-2">
                                                        {(q.options || ['', '', '', '']).map((opt, oi) => (
                                                            <div key={oi} className="flex items-center gap-2">
                                                                <span className="text-gray-500 text-xs w-4">{String.fromCharCode(65 + oi)}.</span>
                                                                <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none" />
                                                            </div>
                                                        ))}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-green-400 text-xs font-bold">Correct Answer:</span>
                                                            <input value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)} placeholder="Must match one of the options exactly" className="flex-1 bg-green-500/5 border border-green-500/20 rounded-lg p-2 text-green-300 text-sm outline-none" />
                                                        </div>
                                                    </div>
                                                )}

                                                {q.type === 'true_false' && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-400 text-xs font-bold">Correct:</span>
                                                        <select value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm outline-none">
                                                            <option value="" className="bg-gray-900">Select</option>
                                                            <option value="True" className="bg-gray-900">True</option>
                                                            <option value="False" className="bg-gray-900">False</option>
                                                        </select>
                                                    </div>
                                                )}

                                                {q.type === 'short_answer' && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-yellow-400 text-xs font-bold">Model Answer (optional):</span>
                                                        <input value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)} placeholder="Expected answer for manual grading..." className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {formData.questions.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-2xl text-gray-500 text-sm">
                                                Click "Add Question" to build your quiz
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button type="submit" disabled={saving} className="w-full py-3.5 bg-blue-600 hover:bg-blue-600/80 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                                    {saving ? 'Saving...' : editing ? 'Update Quiz' : 'Create Quiz'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
