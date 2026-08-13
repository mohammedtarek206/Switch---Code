'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiGrid, FiPlus, FiTrash2, FiEdit2, FiCheckCircle, FiClock,
    FiActivity, FiUsers, FiMail, FiUser, FiInfo, FiLayers
} from 'react-icons/fi';

interface UserDetail {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

interface CommitteeDetail {
    _id: string;
    name: string;
    color: string;
}

interface Interviewer {
    _id: string;
    userId: UserDetail;
    committees: CommitteeDetail[];
    isActive: boolean;
    stats: {
        assigned: number;
        pending: number;
        completed: number;
    };
}

export default function InterviewersPage() {
    const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
    const [candidates, setCandidates] = useState<UserDetail[]>([]);
    const [allCommittees, setAllCommittees] = useState<CommitteeDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingInterviewer, setEditingInterviewer] = useState<Interviewer | null>(null);

    // Form fields state
    const [selectedUserId, setSelectedUserId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedCommitteeIds, setSelectedCommitteeIds] = useState<string[]>([]);
    const [isActiveField, setIsActiveField] = useState(true);

    async function loadData() {
        const token = localStorage.getItem('token');
        try {
            const [intervRes, commsRes] = await Promise.all([
                fetch('/api/community/interviewers', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('/api/community/committees', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (intervRes.ok) {
                const data = await intervRes.json();
                setInterviewers(data);
            }
            if (commsRes.ok) {
                const data = await commsRes.json();
                setAllCommittees(data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadCandidates() {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/community/interviewers?candidates=true', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCandidates(data);
            }
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (showModal && !editingInterviewer) {
            loadCandidates();
        }
    }, [showModal, editingInterviewer]);

    function handleToggleCommittee(id: string) {
        setSelectedCommitteeIds(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    }

    function resetForm() {
        setSelectedUserId('');
        setName('');
        setEmail('');
        setSelectedCommitteeIds([]);
        setIsActiveField(true);
        setEditingInterviewer(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('token');

        const isEditing = !!editingInterviewer;
        const url = isEditing
            ? `/api/community/interviewers/${editingInterviewer._id}`
            : '/api/community/interviewers';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = isEditing
            ? { committees: selectedCommitteeIds, isActive: isActiveField, name, email }
            : { userId: selectedUserId, committees: selectedCommitteeIds, isActive: isActiveField };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setShowModal(false);
                resetForm();
                await loadData();
            } else {
                const errData = await res.json();
                alert(errData.error || 'Failed to save interviewer.');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred.');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to remove this interviewer?')) return;
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`/api/community/interviewers/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                await loadData();
            } else {
                alert('Failed to delete interviewer profile.');
            }
        } catch (err) {
            console.error(err);
        }
    }

    function startEdit(interv: Interviewer) {
        setEditingInterviewer(interv);
        setName(interv.userId.name);
        setEmail(interv.userId.email);
        setSelectedCommitteeIds(interv.committees.map(c => c._id));
        setIsActiveField(interv.isActive);
        setShowModal(true);
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Interviewers Directory</h1>
                    <p className="text-gray-400">Manage recruitment team assignees, candidate scoring permissions, and stats.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center btn-primary-blue px-5 py-3 rounded-xl font-bold transition-all shadow-lg"
                >
                    <FiPlus className="mr-2" /> Add Interviewer
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
                </div>
            ) : (
                <>
                    {interviewers.length === 0 ? (
                        <div className="glass p-12 text-center rounded-3xl space-y-4">
                            <FiUsers className="w-12 h-12 mx-auto text-gray-505" />
                            <h3 className="text-xl font-bold text-white">No interviewers configured yet</h3>
                            <p className="text-gray-400 max-w-md mx-auto">
                                Add users with appropriate roles (such as HR or Technical Committee Leaders) to manage pending applicant intakes.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {interviewers.map((interv) => (
                                <motion.div
                                    key={interv._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-panel p-6 rounded-2xl border border-blue-500/10 flex flex-col justify-between space-y-6"
                                >
                                    {/* Header info */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-bold text-lg text-blue-400">
                                                {interv.userId.avatar ? (
                                                    <img src={interv.userId.avatar} alt={interv.userId.name} className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    interv.userId.name[0]
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-extrabold text-white text-lg">{interv.userId.name}</h3>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${interv.isActive
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        }`}>
                                                        {interv.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 flex items-center mt-1">
                                                    <FiMail className="mr-1" /> {interv.userId.email}
                                                </p>
                                                <p className="text-[11px] text-gold uppercase tracking-wider font-extrabold mt-1">
                                                    Role: {interv.userId.role.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-1">
                                            <button
                                                onClick={() => startEdit(interv)}
                                                className="p-2.5 hover:bg-slate-900 border border-blue-500/20 rounded-lg text-gray-400 hover:text-white transition-all"
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(interv._id)}
                                                className="p-2.5 hover:bg-slate-900 border border-blue-500/20 rounded-lg text-red-400 hover:text-red-500 transition-all"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Committees list */}
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-gray-400 flex items-center">
                                            <FiLayers className="mr-1.5" /> Assigned Committees ({interv.committees.length})
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {interv.committees.length === 0 ? (
                                                <span className="text-xs text-gray-500 italic">No specific committees mapped</span>
                                            ) : (
                                                interv.committees.map((com) => (
                                                    <span
                                                        key={com._id}
                                                        className="text-xs px-2.5 py-1 rounded-lg border flex items-center font-semibold"
                                                        style={{
                                                            backgroundColor: `${com.color || '#0066FF'}10`,
                                                            borderColor: `${com.color || '#0066FF'}30`,
                                                            color: com.color || '#ffffff'
                                                        }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: com.color }} />
                                                        {com.name}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-500/10 text-center">
                                        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-blue-500/5">
                                            <span className="text-xs text-gray-400 block mb-1">Assigned</span>
                                            <span className="text-lg font-extrabold text-white flex items-center justify-center">
                                                <FiActivity className="mr-1 text-blue-400 w-4 h-4" />
                                                {interv.stats.assigned}
                                            </span>
                                        </div>
                                        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-blue-500/5">
                                            <span className="text-xs text-gray-400 block mb-1">Pending</span>
                                            <span className="text-lg font-extrabold text-gold flex items-center justify-center">
                                                <FiClock className="mr-1 text-gold w-4 h-4" />
                                                {interv.stats.pending}
                                            </span>
                                        </div>
                                        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-blue-500/5">
                                            <span className="text-xs text-gray-400 block mb-1">Completed</span>
                                            <span className="text-lg font-extrabold text-emerald-400 flex items-center justify-center">
                                                <FiCheckCircle className="mr-1 text-emerald-400 w-4 h-4" />
                                                {interv.stats.completed}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Config modal (Create/Edit Interviewer) */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-panel w-full max-w-xl rounded-3xl p-8 space-y-6 my-8 box-border"
                        >
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {editingInterviewer ? 'Edit Interviewer Profile' : 'Configure New Interviewer'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* If creating, show candidates dropdown */}
                                {!editingInterviewer ? (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-300 flex items-center">
                                            <FiUser className="mr-1.5" /> Select User Account
                                        </label>
                                        <select
                                            required
                                            value={selectedUserId}
                                            onChange={(e) => setSelectedUserId(e.target.value)}
                                            className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold cursor-pointer"
                                        >
                                            <option value="">-- Choose Candidate User --</option>
                                            {candidates.map(c => (
                                                <option key={c._id} value={c._id}>
                                                    {c.name} ({c.email}) - {c.role.replace('_', ' ')}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    /* If editing, allow changing User metadata */
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-300">Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-bold text-gray-300">Email</label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full p-4 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Committees selector */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-300 flex items-center mb-1">
                                        <FiLayers className="mr-1.5" /> Assigned Committees (Select multiple)
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto p-2 bg-slate-950/40 rounded-xl border border-blue-500/10">
                                        {allCommittees.map(c => {
                                            const isChecked = selectedCommitteeIds.includes(c._id);
                                            return (
                                                <div
                                                    key={c._id}
                                                    onClick={() => handleToggleCommittee(c._id)}
                                                    className={`p-3 rounded-lg border flex items-center space-x-3 cursor-pointer transition-all ${isChecked
                                                            ? 'border-blue-500/50 bg-blue-500/10'
                                                            : 'border-blue-500/5 bg-transparent hover:bg-slate-900'
                                                        }`}
                                                >
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full inline-block"
                                                        style={{ backgroundColor: c.color }}
                                                    />
                                                    <span className="text-xs text-white font-semibold flex-1 leading-none">{c.name}</span>
                                                    <input
                                                        type="checkbox"
                                                        readOnly
                                                        className="cursor-pointer"
                                                        checked={isChecked}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Active toggle inside config */}
                                <div className="flex items-center space-x-3 p-3 bg-slate-900 border border-blue-500/20 rounded-xl">
                                    <input
                                        type="checkbox"
                                        id="activeField"
                                        checked={isActiveField}
                                        onChange={(e) => setIsActiveField(e.target.checked)}
                                        style={{ accentColor: '#0066FF' }}
                                        className="w-5 h-5 cursor-pointer"
                                    />
                                    <label htmlFor="activeField" className="text-sm font-semibold text-gray-300 cursor-pointer select-none">
                                        Active Interviewer
                                    </label>
                                </div>

                                {/* Submissions */}
                                <div className="flex justify-end space-x-3 pt-4 border-t border-blue-500/10">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="px-6 py-3 bg-slate-905 border border-blue-500/20 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-primary-blue px-6 py-3 rounded-xl font-bold disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : 'Save Configuration'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
