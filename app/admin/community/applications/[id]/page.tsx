'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiArrowLeft, FiBookOpen, FiSliders, FiCheck, FiX, FiClock,
    FiMail, FiPhone, FiCode, FiEdit3, FiSave, FiUser, FiActivity
} from 'react-icons/fi';
import Link from 'next/link';

interface FormField { id: string; label: string; }

interface Application {
    _id: string;
    applicationCode: string;
    name: string;
    email: string;
    phone?: string;
    university?: string;
    faculty?: string;
    status: string;
    adminNote?: string;
    formData: Record<string, string>;
    createdAt: string;
    updatedAt: string;
    committeeId: { _id: string; name: string; color?: string };
    recruitmentId: { _id: string; name: string; formFields: FormField[] };
    interview?: {
        date?: string;
        interviewerId?: string | { _id: string; name: string; email?: string };
        interviewerName?: string;
        interviewerEmail?: string;
        interviewStatus?: string;
        assignedAt?: string;
        technicalScore?: number;
        hrScore?: number;
        communication?: number;
        problemSolving?: number;
        notes?: string;
        decision?: string;
        recommendation?: string;
    };
}

interface InterviewerOption { _id: string; name: string; email: string; role: string; }

const STATUS_CONFIG = {
    pending: { label: 'Pending', ar: 'قيد المراجعة', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    reviewing: { label: 'Reviewing', ar: 'تحت المراجعة', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    interview: { label: 'Interview', ar: 'مرحلة المقابلة', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    accepted: { label: 'Accepted', ar: 'مقبول', cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
    rejected: { label: 'Rejected', ar: 'غير مقبول', cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
    waiting: { label: 'Waiting', ar: 'قائمة الانتظار', cls: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
};

const INTERVIEW_STATUSES = [
    'Not Assigned', 'Assigned', 'Scheduled', 'Completed', 'Passed', 'Failed', 'Cancelled'
];

const INTERVIEW_STATUS_COLORS: Record<string, string> = {
    'Not Assigned': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    'Assigned': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Scheduled': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Completed': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    'Passed': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Failed': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Cancelled': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
    const [app, setApp] = useState<Application | null>(null);
    const [interviewers, setInterviewers] = useState<InterviewerOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // Interview form states
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewerId, setInterviewerId] = useState('');
    const [interviewStatus, setInterviewStatus] = useState('Not Assigned');
    const [techScore, setTechScore] = useState(0);
    const [hrScore, setHrScore] = useState(0);
    const [commsScore, setCommsScore] = useState(0);
    const [problemScore, setProblemScore] = useState(0);
    const [notes, setNotes] = useState('');
    const [recommendation, setRecommendation] = useState('');
    const [decision, setDecision] = useState('');

    // Admin note
    const [adminNote, setAdminNote] = useState('');
    const [editingNote, setEditingNote] = useState(false);

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    async function fetchDetails() {
        try {
            const token = localStorage.getItem('token');
            const [appRes, interviewersRes] = await Promise.all([
                fetch(`/api/community/applications/${params.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                }),
                // Fetch registered interviewers from the new system
                fetch('/api/community/interviewers', {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                }),
            ]);

            if (appRes.ok) {
                const data: Application = await appRes.json();
                setApp(data);
                setAdminNote(data.adminNote || '');
                if (data.interview) {
                    if (data.interview.date) setInterviewDate(new Date(data.interview.date).toISOString().substring(0, 16));
                    const iId = data.interview.interviewerId;
                    if (iId) setInterviewerId(typeof iId === 'object' ? iId._id : iId);
                    setInterviewStatus(data.interview.interviewStatus || 'Not Assigned');
                    setTechScore(data.interview.technicalScore || 0);
                    setHrScore(data.interview.hrScore || 0);
                    setCommsScore(data.interview.communication || 0);
                    setProblemScore(data.interview.problemSolving || 0);
                    setNotes(data.interview.notes || '');
                    setRecommendation(data.interview.recommendation || '');
                    setDecision(data.interview.decision || '');
                }
            }
            if (interviewersRes.ok) {
                const data = await interviewersRes.json();
                // Map populated interviewer objects to flat list
                const users: InterviewerOption[] = (data || [])
                    .filter((item: any) => item.userId && item.isActive)
                    .map((item: any) => ({
                        _id: item.userId._id,
                        name: item.userId.name,
                        email: item.userId.email,
                        role: item.userId.role,
                    }));
                setInterviewers(users);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchDetails(); }, [params.id]);

    async function handleStatusChange(newStatus: string) {
        if (!app) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/community/applications/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setApp(prev => prev ? { ...prev, status: newStatus } : null);
                showToast('Status updated successfully', 'success');
            } else showToast('Failed to update status', 'error');
        } catch { showToast('Network error', 'error'); } finally { setSaving(false); }
    }

    async function handleSaveNote() {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/community/applications/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ adminNote }),
            });
            if (res.ok) { setApp(prev => prev ? { ...prev, adminNote } : null); setEditingNote(false); showToast('Note saved', 'success'); }
            else showToast('Failed to save note', 'error');
        } catch { showToast('Network error', 'error'); } finally { setSaving(false); }
    }

    async function handleSaveInterview(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            // Use the dedicated interview endpoint
            const res = await fetch(`/api/community/applications/${params.id}/interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    date: interviewDate ? new Date(interviewDate).toISOString() : undefined,
                    interviewerId: interviewerId || undefined,
                    interviewStatus,
                    technicalScore: Number(techScore),
                    hrScore: Number(hrScore),
                    communication: Number(commsScore),
                    problemSolving: Number(problemScore),
                    notes,
                    recommendation,
                    decision: decision || undefined,
                }),
            });
            if (res.ok) { showToast('Interview details saved!', 'success'); fetchDetails(); }
            else showToast('Failed to save interview', 'error');
        } catch { showToast('Error saving', 'error'); } finally { setSaving(false); }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold" />
            </div>
        );
    }

    if (!app) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">Application not found.</p>
                <Link href="/admin/community/applications" className="text-gold underline mt-2 block">Back to List</Link>
            </div>
        );
    }

    const sc = STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    const currentInterviewStatus = app.interview?.interviewStatus || 'Not Assigned';
    const avgScore = [techScore, hrScore, commsScore, problemScore].filter(v => v > 0).length > 0
        ? ((techScore + hrScore + commsScore + problemScore) / 4).toFixed(1)
        : '—';

    return (
        <div className="space-y-8 pb-12">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-2xl font-bold text-sm shadow-2xl ${toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="space-y-4">
                <Link href="/admin/community/applications" className="flex items-center gap-2 text-gray-400 hover:text-white w-fit transition-colors">
                    <FiArrowLeft /> Back to Applications
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h1 className="text-3xl font-extrabold text-white">{app.name}</h1>
                            <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase border ${sc.cls}`}>{sc.label}</span>
                            {app.interview?.interviewStatus && (
                                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${INTERVIEW_STATUS_COLORS[currentInterviewStatus] || ''}`}>
                                    Interview: {currentInterviewStatus}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                            <span className="flex items-center gap-1"><FiMail className="w-3.5 h-3.5" />{app.email}</span>
                            {app.phone && <span className="flex items-center gap-1"><FiPhone className="w-3.5 h-3.5" />{app.phone}</span>}
                            <code className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded text-gold text-xs">
                                <FiCode className="w-3" />{app.applicationCode}
                            </code>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                        <div>Applied: {new Date(app.createdAt).toLocaleString()}</div>
                        <div>Updated: {new Date(app.updatedAt).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Quick Status Actions */}
            <div className="glass-panel p-5 rounded-2xl">
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-3">Quick Status Update</h3>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(k => (
                        <button
                            key={k}
                            onClick={() => handleStatusChange(k)}
                            disabled={saving || app.status === k}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${app.status === k ? STATUS_CONFIG[k].cls + ' opacity-100' : 'bg-slate-900 border-white/10 text-gray-400 hover:border-white/30'}`}
                        >
                            {STATUS_CONFIG[k].label} — {STATUS_CONFIG[k].ar}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Form answers */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-8 rounded-3xl space-y-6">
                        <h3 className="text-xl font-bold text-white border-b border-blue-500/20 pb-4 flex items-center gap-2">
                            <FiBookOpen className="text-gold" /> Application Details
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            {[
                                ['Committee', app.committeeId?.name],
                                ['Recruitment', app.recruitmentId?.name],
                                ['University', app.university || 'N/A'],
                                ['Faculty', app.faculty || 'N/A'],
                            ].map(([label, value]) => (
                                <div key={label} className="space-y-1">
                                    <span className="text-gray-500 font-semibold block text-xs uppercase">{label}</span>
                                    <span className="text-white font-bold">{value}</span>
                                </div>
                            ))}
                        </div>

                        {app.recruitmentId?.formFields?.length > 0 && (
                            <div className="space-y-5 pt-4 border-t border-blue-500/20">
                                <h4 className="text-sm font-bold text-gray-300">Questionnaire Answers</h4>
                                {app.recruitmentId.formFields.map(field => (
                                    <div key={field.id} className="space-y-1.5">
                                        <label className="text-xs text-gray-400 uppercase font-semibold">{field.label}</label>
                                        <p className="p-4 bg-slate-900 border border-blue-500/10 rounded-xl text-gray-300 text-sm whitespace-pre-wrap">
                                            {app.formData?.[field.id] || <span className="text-gray-600 italic">Not answered</span>}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {Object.keys(app.formData || {}).filter(k => !app.recruitmentId?.formFields?.find(f => f.id === k)).length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-blue-500/20">
                                <h4 className="text-sm font-bold text-gray-300">Additional Data</h4>
                                {Object.entries(app.formData || {}).filter(([k]) => !app.recruitmentId?.formFields?.find(f => f.id === k)).map(([k, v]) => (
                                    <div key={k} className="space-y-1">
                                        <label className="text-xs text-gray-400 uppercase font-semibold">{k}</label>
                                        <p className="p-3 bg-slate-900 border border-blue-500/10 rounded-xl text-gray-300 text-sm">{v}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Admin Note */}
                    <div className="glass-panel p-6 rounded-3xl space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-white flex items-center gap-2"><FiEdit3 className="text-gold" /> Admin Note</h3>
                            {!editingNote ? (
                                <button onClick={() => setEditingNote(true)} className="text-xs text-gold hover:underline">Edit</button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingNote(false)} className="text-xs text-gray-400 hover:text-white">Cancel</button>
                                    <button onClick={handleSaveNote} disabled={saving} className="text-xs text-green-400 hover:underline flex items-center gap-1">
                                        <FiSave className="w-3 h-3" /> Save
                                    </button>
                                </div>
                            )}
                        </div>
                        {editingNote ? (
                            <textarea
                                rows={4}
                                value={adminNote}
                                onChange={e => setAdminNote(e.target.value)}
                                placeholder="Add a private note about this applicant..."
                                className="w-full p-3 bg-slate-900 border border-blue-500/20 rounded-xl text-white text-sm outline-none resize-none focus:border-gold"
                            />
                        ) : (
                            <p className="text-gray-400 text-sm min-h-[2rem]">{app.adminNote || <span className="italic text-gray-600">No note added.</span>}</p>
                        )}
                    </div>
                </div>

                {/* Interview & Score Card */}
                <div className="space-y-6">
                    {/* Interview Status Summary */}
                    {app.interview && (
                        <div className="glass-panel p-5 rounded-2xl space-y-3 border border-blue-500/10">
                            <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                <FiActivity className="text-blue-400" /> Interview Summary
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="text-xs text-gray-500 mb-0.5">Status</div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${INTERVIEW_STATUS_COLORS[currentInterviewStatus] || 'text-gray-400'}`}>
                                        {currentInterviewStatus}
                                    </span>
                                </div>
                                {app.interview.interviewerId && typeof app.interview.interviewerId === 'object' && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-0.5">Interviewer</div>
                                        <div className="text-white text-xs font-semibold">{app.interview.interviewerId.name}</div>
                                    </div>
                                )}
                                {avgScore !== '—' && (
                                    <div className="col-span-2">
                                        <div className="text-xs text-gray-500 mb-0.5">Avg Score</div>
                                        <div className="text-gold font-extrabold text-lg">{avgScore}<span className="text-xs text-gray-500">/10</span></div>
                                    </div>
                                )}
                                {app.interview.recommendation && (
                                    <div className="col-span-2">
                                        <div className="text-xs text-gray-500 mb-0.5">Recommendation</div>
                                        <p className="text-gray-300 text-xs bg-slate-900 p-2 rounded-lg border border-blue-500/10">{app.interview.recommendation}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Interview Form */}
                    <div className="glass-panel p-8 rounded-3xl space-y-6">
                        <h3 className="text-xl font-bold text-white border-b border-blue-500/20 pb-4 flex items-center gap-2">
                            <FiSliders className="text-blue-400" /> Interview Score Card
                        </h3>
                        <form onSubmit={handleSaveInterview} className="space-y-4">

                            {/* Assign Interviewer */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-semibold uppercase flex items-center gap-1">
                                    <FiUser className="w-3 h-3" /> Assign Interviewer
                                </label>
                                <select value={interviewerId} onChange={e => setInterviewerId(e.target.value)}
                                    className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none text-sm">
                                    <option value="">— No Interviewer Assigned —</option>
                                    {interviewers.length === 0 && (
                                        <option disabled className="text-gray-500">No registered interviewers (add from Interviewers page)</option>
                                    )}
                                    {interviewers.map(i => (
                                        <option key={i._id} value={i._id}>{i.name} ({i.email}) — {i.role.replace('_', ' ')}</option>
                                    ))}
                                </select>
                                {interviewers.length === 0 && (
                                    <p className="text-xs text-yellow-500 mt-1">
                                        ⚠️ No interviewers registered yet. <Link href="/admin/community/interviewers" className="underline">Add interviewers here</Link>.
                                    </p>
                                )}
                            </div>

                            {/* Interview Status */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-semibold uppercase">Interview Stage</label>
                                <select value={interviewStatus} onChange={e => setInterviewStatus(e.target.value)}
                                    className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none text-sm">
                                    {INTERVIEW_STATUSES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-semibold uppercase">Interview Date & Time</label>
                                <input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)}
                                    className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none focus:border-gold text-sm" />
                            </div>

                            {/* Scores */}
                            <div className="grid grid-cols-2 gap-3 border-t border-blue-500/20 pt-4">
                                {([
                                    ['Technical', techScore, setTechScore],
                                    ['HR Score', hrScore, setHrScore],
                                    ['Communication', commsScore, setCommsScore],
                                    ['Problem Solving', problemScore, setProblemScore],
                                ] as [string, number, React.Dispatch<React.SetStateAction<number>>][]).map(([label, val, setter]) => (
                                    <div key={label} className="space-y-1">
                                        <label className="text-xs text-gray-400 font-semibold block uppercase">{label}</label>
                                        <div className="flex items-center gap-2">
                                            <input type="range" min="0" max="10" value={val}
                                                onChange={e => setter(Number(e.target.value))}
                                                style={{ accentColor: '#FACC15' }}
                                                className="flex-1" />
                                            <span className="text-white font-bold text-sm w-6 text-right">{val}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Notes */}
                            <div className="space-y-1 border-t border-blue-500/20 pt-4">
                                <label className="text-xs text-gray-400 font-semibold uppercase">Notes</label>
                                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                                    placeholder="Interview remarks..."
                                    className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white text-sm outline-none resize-none" />
                            </div>

                            {/* Recommendation */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-semibold uppercase">Recommendation</label>
                                <textarea rows={2} value={recommendation} onChange={e => setRecommendation(e.target.value)}
                                    placeholder="Interviewer recommendation..."
                                    className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white text-sm outline-none resize-none" />
                            </div>

                            {/* Final Decision */}
                            <div className="space-y-1 border-t border-blue-500/20 pt-4">
                                <label className="text-xs text-gray-400 font-semibold uppercase">Final Decision</label>
                                <select value={decision} onChange={e => setDecision(e.target.value)}
                                    className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-xl text-white outline-none text-sm">
                                    <option value="">No Decision Yet</option>
                                    <option value="accepted">✅ Accepted</option>
                                    <option value="rejected">❌ Rejected</option>
                                    <option value="waiting">⏳ Waiting List</option>
                                </select>
                            </div>

                            <button type="submit" disabled={saving}
                                className="w-full btn-primary-blue py-3 rounded-xl font-bold transition-all mt-2 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Interview Data'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
