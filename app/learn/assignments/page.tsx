'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiClipboard, FiClock, FiUpload, FiCheckCircle, FiAlertCircle,
    FiRefreshCw, FiArrowLeft, FiTarget, FiX, FiExternalLink,
    FiAlertTriangle, FiStar
} from 'react-icons/fi';
import Link from 'next/link';

interface Assignment {
    _id: string;
    title: string;
    description: string;
    instructions: string;
    deadline?: string;
    attachmentUrl?: string;
    maxScore: number;
    order: number;
    submission?: {
        status: 'submitted' | 'reviewed' | 'graded' | 'returned';
        submittedAt: string;
        score?: number;
        feedback?: string;
    } | null;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    submitted: { label: 'Submitted', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    reviewed: { label: 'Under Review', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    graded: { label: 'Graded', color: 'text-green-400', bg: 'bg-green-500/10' },
    returned: { label: 'Returned', color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [noTrack, setNoTrack] = useState(false);

    // Submission modal
    const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
    const [submissionText, setSubmissionText] = useState('');
    const [submissionUrl, setSubmissionUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lms/assignments', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            if (res.status === 401) { window.location.href = '/login'; return; }
            if (!res.ok) throw new Error('err');
            const data = await res.json();
            if (data.noTrack) { setNoTrack(true); return; }
            setAssignments(data.assignments || []);
        } catch {
            setError('حدث خطأ أثناء تحميل المهام');
        } finally {
            setLoading(false);
        }
    };

    const openAssignment = (assignment: Assignment) => {
        setActiveAssignment(assignment);
        setSubmissionText(assignment.submission ? 'Previously submitted' : '');
        setSubmissionUrl('');
        setSubmitSuccess(false);
    };

    const handleSubmit = async () => {
        if (!activeAssignment || (!submissionText.trim() && !submissionUrl.trim())) {
            alert('Please provide your submission text or URL');
            return;
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lms/assignments/submit', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: activeAssignment._id,
                    submissionText: submissionText.trim(),
                    submissionUrl: submissionUrl.trim(),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setSubmitSuccess(true);
                fetchAssignments();
            } else {
                alert(data.error || 'Submission failed');
            }
        } catch {
            alert('Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const isOverdue = (deadline?: string) => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
    };

    const daysLeft = (deadline?: string) => {
        if (!deadline) return null;
        const diff = new Date(deadline).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-400 font-medium">Loading Assignments...</p>
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
                    <button onClick={fetchAssignments} className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl font-bold text-sm">
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
                    <p className="text-gray-400">Please select a track to access assignments.</p>
                    <Link href="/learn" className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl font-bold text-sm">
                        <FiTarget className="w-4 h-4" /> Choose Track
                    </Link>
                </div>
            </div>
        );
    }

    const submittedCount = assignments.filter(a => a.submission).length;

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
                                <FiClipboard className="text-green-400" /> Assignments & Projects
                            </h1>
                            <p className="text-gray-400 text-sm mt-1">{submittedCount} / {assignments.length} submitted</p>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                {assignments.length > 0 && (
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${assignments.length > 0 ? Math.round((submittedCount / assignments.length) * 100) : 0}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                        />
                    </div>
                )}

                {/* Empty */}
                {assignments.length === 0 && (
                    <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
                        <FiClipboard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">No Assignments Available</h2>
                        <p className="text-gray-400">No assignments available for your track yet.</p>
                    </div>
                )}

                {/* Assignments */}
                <div className="space-y-5">
                    {assignments.map((assignment, idx) => {
                        const days = daysLeft(assignment.deadline);
                        const overdue = isOverdue(assignment.deadline);
                        const status = assignment.submission?.status;
                        const cfg = status ? statusConfig[status] : null;

                        return (
                            <motion.div
                                key={assignment._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`bg-white/[0.02] rounded-2xl border p-6 transition-all ${status === 'graded' ? 'border-green-500/20' :
                                        overdue && !status ? 'border-red-500/20' : 'border-white/5'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <h3 className="font-bold text-white text-lg">{assignment.title}</h3>
                                            {cfg && (
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.color} ${cfg.bg}`}>
                                                    {cfg.label}
                                                </span>
                                            )}
                                            {!status && overdue && (
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-red-400 bg-red-500/10">
                                                    Overdue
                                                </span>
                                            )}
                                        </div>

                                        {assignment.description && (
                                            <p className="text-gray-400 text-sm line-clamp-2 mb-3">{assignment.description}</p>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <FiStar className="w-3 h-3 text-yellow-400" /> Max Score: {assignment.maxScore}
                                            </span>
                                            {assignment.deadline && (
                                                <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : days !== null && days <= 3 ? 'text-orange-400' : 'text-gray-400'
                                                    }`}>
                                                    <FiClock className="w-3 h-3" />
                                                    {overdue ? 'Overdue' : days !== null ? `${days} day${days !== 1 ? 's' : ''} left` : ''}
                                                    {' '}({new Date(assignment.deadline).toLocaleDateString()})
                                                </span>
                                            )}
                                        </div>

                                        {/* Graded result */}
                                        {assignment.submission?.score != null && (
                                            <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                                                <p className="text-green-400 font-bold text-sm">
                                                    Score: {assignment.submission.score} / {assignment.maxScore}
                                                </p>
                                                {assignment.submission.feedback && (
                                                    <p className="text-gray-400 text-xs mt-1">{assignment.submission.feedback}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                        {assignment.attachmentUrl && (
                                            <a
                                                href={assignment.attachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-gray-300 rounded-xl font-bold text-xs hover:bg-white/10 transition-all"
                                            >
                                                <FiExternalLink className="w-3.5 h-3.5" /> Instructions
                                            </a>
                                        )}
                                        {!overdue && (
                                            <button
                                                onClick={() => openAssignment(assignment)}
                                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all border ${status
                                                        ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                                        : 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                                                    }`}
                                            >
                                                <FiUpload className="w-3.5 h-3.5" />
                                                {status ? 'View / Resubmit' : 'Submit'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Submission Modal */}
            <AnimatePresence>
                {activeAssignment && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1220] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-green-500/20 shadow-2xl p-8"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{activeAssignment.title}</h2>
                                    <p className="text-gray-400 text-sm mt-1">Max Score: {activeAssignment.maxScore}</p>
                                </div>
                                <button onClick={() => setActiveAssignment(null)} className="p-2 hover:bg-white/5 rounded-xl text-gray-400">
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Instructions */}
                            {activeAssignment.instructions && (
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5 mb-6">
                                    <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Instructions</h3>
                                    <p className="text-gray-400 text-sm whitespace-pre-wrap">{activeAssignment.instructions}</p>
                                </div>
                            )}

                            {/* Already submitted */}
                            {activeAssignment.submission && !submitSuccess && (
                                <div className={`p-4 rounded-xl border mb-6 ${statusConfig[activeAssignment.submission.status]?.bg || 'bg-white/[0.02]'} ${statusConfig[activeAssignment.submission.status]?.color || ''} border-current/30`}>
                                    <p className="font-bold text-sm mb-1">
                                        ✓ Submitted on {new Date(activeAssignment.submission.submittedAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs opacity-80">Status: {statusConfig[activeAssignment.submission.status]?.label}</p>
                                    {activeAssignment.submission.score != null && (
                                        <p className="text-xs mt-1 font-bold">Score: {activeAssignment.submission.score}/{activeAssignment.maxScore}</p>
                                    )}
                                    {activeAssignment.submission.feedback && (
                                        <p className="text-xs mt-2 opacity-80">Feedback: {activeAssignment.submission.feedback}</p>
                                    )}
                                </div>
                            )}

                            {/* Success */}
                            {submitSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8"
                                >
                                    <FiCheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Submitted Successfully!</h3>
                                    <p className="text-gray-400 text-sm mb-6">Your assignment has been submitted for review.</p>
                                    <button
                                        onClick={() => setActiveAssignment(null)}
                                        className="px-6 py-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl font-bold text-sm hover:bg-green-500/20 transition-all"
                                    >
                                        Back to Assignments
                                    </button>
                                </motion.div>
                            )}

                            {/* Submission Form */}
                            {!submitSuccess && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">
                                            Your Work / Description
                                        </label>
                                        <textarea
                                            value={submissionText === 'Previously submitted' ? '' : submissionText}
                                            onChange={e => setSubmissionText(e.target.value)}
                                            placeholder="Describe your work, paste your code, or write your answers..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-green-500/30 resize-none h-32 placeholder-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">
                                            Submission URL <span className="text-gray-500 font-normal">(GitHub, Drive, etc.)</span>
                                        </label>
                                        <input
                                            type="url"
                                            value={submissionUrl}
                                            onChange={e => setSubmissionUrl(e.target.value)}
                                            placeholder="https://github.com/..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-green-500/30"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || (!submissionText.trim() && !submissionUrl.trim())}
                                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-400 text-black rounded-xl font-extrabold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Assignment'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
