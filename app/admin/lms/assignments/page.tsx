'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiX, FiEye, FiEyeOff } from 'react-icons/fi';

interface Track { _id: string; name: string }
interface Assignment {
    _id: string;
    title: string;
    deadline?: string;
    maxScore: number;
    published: boolean;
    order: number;
    trackId: { _id: string; name: string } | string;
    submissionCount: number;
}

const emptyForm = { title: '', description: '', instructions: '', trackId: '', deadline: '', attachmentUrl: '', maxScore: 100, published: true, order: 0 };

export default function AdminLMSAssignments() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Assignment | null>(null);
    const [formData, setFormData] = useState<any>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [viewSubmissions, setViewSubmissions] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [subLoading, setSubLoading] = useState(false);
    const [gradingId, setGradingId] = useState<string | null>(null);
    const [gradeForm, setGradeForm] = useState({ score: 0, feedback: '', status: 'graded' });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const h = { Authorization: `Bearer ${token}` };
        try {
            const [aRes, tRes] = await Promise.all([fetch('/api/lms/assignments/admin', { headers: h }), fetch('/api/lms/tracks/admin', { headers: h })]);
            const aData = await aRes.json();
            const tData = await tRes.json();
            setAssignments(aData.assignments || []);
            setTracks(tData.tracks || []);
        } catch { }
        finally { setLoading(false); }
    };

    const openCreate = () => { setModalError(null); setEditing(null); setFormData(emptyForm); setShowModal(true); };
    const openEdit = (a: Assignment) => {
        setModalError(null);
        setEditing(a);
        setFormData({ title: a.title, description: '', instructions: '', trackId: typeof a.trackId === 'object' ? a.trackId._id : a.trackId, deadline: a.deadline ? new Date(a.deadline).toISOString().split('T')[0] : '', attachmentUrl: '', maxScore: a.maxScore, published: a.published, order: a.order });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setModalError(null);
        try {
            const token = localStorage.getItem('token');
            const url = editing ? `/api/lms/assignments/${editing._id}` : '/api/lms/assignments';
            const method = editing ? 'PATCH' : 'POST';
            const body = { ...formData, deadline: formData.deadline ? new Date(formData.deadline) : undefined };
            const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (res.ok) { setShowModal(false); fetchAll(); }
            else { setModalError(data.error || 'Failed to save assignment'); }
        } catch (err: any) { setModalError(err.message || 'Network error'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this assignment?')) return;
        const token = localStorage.getItem('token');
        await fetch(`/api/lms/assignments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        fetchAll();
    };

    const togglePublish = async (a: Assignment) => {
        const token = localStorage.getItem('token');
        await fetch(`/api/lms/assignments/${a._id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !a.published }) });
        fetchAll();
    };

    const openSubmissions = async (assignment: Assignment) => {
        setViewSubmissions(assignment);
        setSubLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/lms/assignments/${assignment._id}/submissions`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setSubmissions(data.submissions || []);
        } catch { }
        finally { setSubLoading(false); }
    };

    const submitGrade = async (submissionId: string) => {
        const token = localStorage.getItem('token');
        await fetch(`/api/lms/assignments/${viewSubmissions._id}/submissions`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ submissionId, ...gradeForm }),
        });
        setGradingId(null);
        openSubmissions(viewSubmissions);
    };

    const statusColors: Record<string, string> = { submitted: 'text-blue-400 bg-blue-500/10', reviewed: 'text-yellow-400 bg-yellow-500/10', graded: 'text-green-400 bg-green-500/10', returned: 'text-orange-400 bg-orange-500/10' };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Assignments & Projects</h1>
                    <p className="text-gray-400 text-sm mt-1">{assignments.length} total assignments</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-600/80 text-white rounded-xl font-bold text-sm">
                    <FiPlus className="w-4 h-4" /> Add Assignment
                </button>
            </div>

            <div className="bg-[#0B1220] rounded-2xl border border-blue-500/20 overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[650px]">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {['Title', 'Track', 'Deadline', 'Max Score', 'Submissions', 'Status', 'Actions'].map(h => (
                                <th key={h} className="text-left px-4 py-3.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-500">Loading...</td></tr>
                        ) : assignments.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-500">No assignments yet</td></tr>
                        ) : (
                            assignments.map(a => (
                                <tr key={a._id} className="hover:bg-white/[0.02]">
                                    <td className="px-4 py-4 font-bold text-white text-sm">{a.title}</td>
                                    <td className="px-4 py-4 text-sm text-gray-400">{typeof a.trackId === 'object' ? a.trackId.name : '-'}</td>
                                    <td className="px-4 py-4 text-sm text-gray-400">{a.deadline ? new Date(a.deadline).toLocaleDateString() : '-'}</td>
                                    <td className="px-4 py-4 text-sm text-yellow-400 font-bold">{a.maxScore}</td>
                                    <td className="px-4 py-4">
                                        <button onClick={() => openSubmissions(a)} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-bold">
                                            {a.submissionCount} submissions →
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button onClick={() => togglePublish(a)} className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${a.published ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                            {a.published ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(a)} className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg"><FiEdit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(a._id)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"><FiTrash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1220] w-full max-w-2xl rounded-3xl p-8 border border-blue-500/30 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">{editing ? 'Edit Assignment' : 'Create Assignment'}</h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl text-gray-400"><FiX className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSave} className="space-y-4">
                                {modalError && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                                        {modalError}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Title *</label>
                                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Assignment title" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/30" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Track *</label>
                                        <select required value={formData.trackId} onChange={e => setFormData({ ...formData, trackId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none">
                                            <option value="" className="bg-gray-900">Select Track</option>
                                            {tracks.map(t => <option key={t._id} value={t._id} className="bg-gray-900">{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Deadline</label>
                                        <input type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Max Score</label>
                                        <input type="number" value={formData.maxScore} onChange={e => setFormData({ ...formData, maxScore: +e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Order</label>
                                        <input type="number" value={formData.order} onChange={e => setFormData({ ...formData, order: +e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Description</label>
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none h-20 resize-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Instructions (shown to student)</label>
                                        <textarea value={formData.instructions} onChange={e => setFormData({ ...formData, instructions: e.target.value })} placeholder="Detailed instructions for students..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none h-28 resize-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">Attachment URL (optional)</label>
                                        <input value={formData.attachmentUrl} onChange={e => setFormData({ ...formData, attachmentUrl: e.target.value })} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-bold uppercase">Published</span>
                                        <button type="button" onClick={() => setFormData({ ...formData, published: !formData.published })} className={`w-10 h-5 rounded-full relative transition-all ${formData.published ? 'bg-green-500' : 'bg-gray-600'}`}>
                                            <span className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${formData.published ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                <button type="submit" disabled={saving} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm disabled:opacity-50">
                                    {saving ? 'Saving...' : editing ? 'Update' : 'Create Assignment'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Submissions View Modal */}
            <AnimatePresence>
                {viewSubmissions && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1220] w-full max-w-3xl rounded-3xl p-8 border border-blue-500/30 my-4">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Submissions</h2>
                                    <p className="text-gray-400 text-sm">{viewSubmissions.title}</p>
                                </div>
                                <button onClick={() => { setViewSubmissions(null); setGradingId(null); }} className="p-2 hover:bg-white/5 rounded-xl text-gray-400"><FiX className="w-5 h-5" /></button>
                            </div>

                            {subLoading ? (
                                <div className="text-center py-8 text-gray-500">Loading submissions...</div>
                            ) : submissions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">No submissions yet</div>
                            ) : (
                                <div className="space-y-4">
                                    {submissions.map((sub: any) => (
                                        <div key={sub._id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <p className="font-bold text-white">{sub.userId?.name || 'Unknown'}</p>
                                                    <p className="text-gray-500 text-xs">{sub.userId?.email}</p>
                                                    <p className="text-gray-500 text-xs mt-1">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[sub.status] || 'bg-gray-500/10 text-gray-400'}`}>{sub.status}</span>
                                                    {sub.score != null && <span className="text-green-400 text-sm font-bold">{sub.score}/{viewSubmissions.maxScore}</span>}
                                                </div>
                                            </div>

                                            {sub.submissionText && (
                                                <div className="bg-white/[0.02] rounded-xl p-3 mb-3 border border-white/5">
                                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{sub.submissionText}</p>
                                                </div>
                                            )}
                                            {sub.submissionUrl && (
                                                <a href={sub.submissionUrl} target="_blank" className="text-blue-400 text-xs hover:underline block mb-3">{sub.submissionUrl}</a>
                                            )}
                                            {sub.feedback && (
                                                <p className="text-gray-400 text-xs italic mb-3">Feedback: {sub.feedback}</p>
                                            )}

                                            {gradingId === sub._id ? (
                                                <div className="space-y-3 bg-white/[0.02] rounded-xl p-4 border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <label className="text-xs text-gray-400 font-bold uppercase">Score</label>
                                                        <input type="number" max={viewSubmissions.maxScore} value={gradeForm.score} onChange={e => setGradeForm({ ...gradeForm, score: +e.target.value })} className="w-20 bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none" />
                                                        <span className="text-gray-500 text-xs">/ {viewSubmissions.maxScore}</span>
                                                    </div>
                                                    <textarea value={gradeForm.feedback} onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })} placeholder="Feedback for student..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none h-16 resize-none" />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => submitGrade(sub._id)} className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-xl text-xs font-bold hover:bg-green-500/20">Submit Grade</button>
                                                        <button onClick={() => setGradingId(null)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-xs font-bold hover:bg-white/10">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setGradingId(sub._id); setGradeForm({ score: sub.score || 0, feedback: sub.feedback || '', status: 'graded' }); }} className="text-xs text-blue-400 font-bold hover:text-blue-300 transition-colors">
                                                    {sub.score != null ? '✏ Edit Grade' : '+ Grade Submission'}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
