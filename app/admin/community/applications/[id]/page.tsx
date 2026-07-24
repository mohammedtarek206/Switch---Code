'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiUser, FiCalendar, FiBookOpen, FiStar, FiSliders, FiMessageSquare } from 'react-icons/fi';
import Link from 'next/link';

interface User {
    _id: string;
    name: string;
}

interface Application {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    university?: string;
    faculty?: string;
    status: string;
    formData: Record<string, string>;
    createdAt: string;
    committeeId: {
        _id: string;
        name: string;
    };
    recruitmentId: {
        _id: string;
        name: string;
        formFields: Array<{ id: string; label: string }>;
    };
    interview?: {
        date?: string;
        interviewerId?: string;
        technicalScore?: number;
        hrScore?: number;
        communication?: number;
        problemSolving?: number;
        notes?: string;
        decision?: string;
    };
}

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
    const [app, setApp] = useState<Application | null>(null);
    const [interviewers, setInterviewers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Score states
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewerId, setInterviewerId] = useState('');
    const [techScore, setTechScore] = useState(0);
    const [hrScore, setHrScore] = useState(0);
    const [commsScore, setCommsScore] = useState(0);
    const [problemScore, setProblemScore] = useState(0);
    const [notes, setNotes] = useState('');
    const [decision, setDecision] = useState('');

    async function fetchDetails() {
        try {
            const token = localStorage.getItem('token');
            const [appRes, interviewersRes] = await Promise.all([
                fetch(`/api/community/applications/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } }) // HR matches student users with admin roles
            ]);

            if (appRes.ok) {
                const data: Application = await appRes.json();
                setApp(data);
                if (data.interview) {
                    if (data.interview.date) setInterviewDate(new Date(data.interview.date).toISOString().substring(0, 16));
                    if (data.interview.interviewerId) setInterviewerId((data.interview.interviewerId as unknown as User)._id || (data.interview.interviewerId as unknown as string));
                    setTechScore(data.interview.technicalScore || 0);
                    setHrScore(data.interview.hrScore || 0);
                    setCommsScore(data.interview.communication || 0);
                    setProblemScore(data.interview.problemSolving || 0);
                    setNotes(data.interview.notes || '');
                    setDecision(data.interview.decision || '');
                }
            }
            if (interviewersRes.ok) {
                setInterviewers(await interviewersRes.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDetails();
    }, [params.id]);

    async function handleSaveInterview(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const payload = {
            date: interviewDate ? new Date(interviewDate).toISOString() : undefined,
            interviewerId: interviewerId || undefined,
            technicalScore: Number(techScore),
            hrScore: Number(hrScore),
            communication: Number(commsScore),
            problemSolving: Number(problemScore),
            notes,
            decision: decision || undefined
        };

        try {
            const res = await fetch(`/api/community/applications/${params.id}/interview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('Interview details saved!');
                fetchDetails();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save');
            }
        } catch {
            alert('Error');
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!app) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-400">Application not found.</p>
                <Link href="/admin/community/applications" className="text-accent underline">Back to List</Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="space-y-4">
                <Link href="/admin/community/applications" className="flex items-center text-gray-400 hover:text-white w-fit">
                    <FiArrowLeft className="mr-2" /> Back to Applicants
                </Link>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white">{app.name}</h1>
                        <p className="text-gray-400 text-sm">{app.email} • {app.phone || 'No phone number'}</p>
                    </div>
                    <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs text-accent font-bold">
                        Target Committee: {app.committeeId?.name}
                    </span>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Dynamic Form Submissions answers */}
                <div className="glass p-8 rounded-3xl lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4 flex items-center">
                        <FiBookOpen className="mr-2 text-accent" /> Questionnaire Review
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-1">
                            <span className="text-gray-500 font-semibold block">University</span>
                            <span className="text-white block font-bold">{app.university || 'N/A'}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-gray-500 font-semibold block">Faculty</span>
                            <span className="text-white block font-bold">{app.faculty || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-white/5">
                        {app.recruitmentId?.formFields?.map((field) => {
                            const answer = app.formData?.[field.id] || 'Not specified';
                            return (
                                <div key={field.id} className="space-y-1">
                                    <label className="text-xs text-gray-400 uppercase font-semibold">{field.label}</label>
                                    <p className="p-4 bg-white/5 rounded-xl border border-white/5 text-gray-300 text-sm whitespace-pre-wrap">
                                        {answer}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Dynamic Interview Board & Decisions */}
                <div className="glass p-8 rounded-3xl space-y-6">
                    <h3 className="text-xl font-bold text-white border-b border-white/5 pb-4 flex items-center">
                        <FiSliders className="mr-2 text-primary" /> Interview & Score Card
                    </h3>

                    <form onSubmit={handleSaveInterview} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-semibold uppercase">Interview Date</label>
                            <input
                                type="datetime-local"
                                value={interviewDate}
                                onChange={(e) => setInterviewDate(e.target.value)}
                                className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-semibold uppercase">Interviewer</label>
                            <select
                                value={interviewerId}
                                onChange={(e) => setInterviewerId(e.target.value)}
                                className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                            >
                                <option value="">Select Interviewer</option>
                                {interviewers.map(i => (
                                    <option key={i._id} value={i._id}>{i.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-semibold block uppercase">Technical Score</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={techScore}
                                    onChange={(e) => setTechScore(Number(e.target.value))}
                                    className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white text-sm outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-semibold block uppercase">HR Score</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={hrScore}
                                    onChange={(e) => setHrScore(Number(e.target.value))}
                                    className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white text-sm outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-semibold block uppercase">Communication</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={commsScore}
                                    onChange={(e) => setCommsScore(Number(e.target.value))}
                                    className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white text-sm outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400 font-semibold block uppercase">Problem Solving</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={problemScore}
                                    onChange={(e) => setProblemScore(Number(e.target.value))}
                                    className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1 border-t border-white/5 pt-4">
                            <label className="text-xs text-gray-400 font-semibold uppercase">Notes</label>
                            <textarea
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Candidate remarks, experience level notes..."
                                className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white text-sm outline-none resize-none"
                            />
                        </div>

                        <div className="space-y-1 border-t border-white/5 pt-4">
                            <label className="text-xs text-gray-400 font-semibold uppercase">Final Decision</label>
                            <select
                                value={decision}
                                onChange={(e) => setDecision(e.target.value)}
                                className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                            >
                                <option value="">No Decision</option>
                                <option value="accepted">Accepted (Qualifies for Role)</option>
                                <option value="rejected">Rejected</option>
                                <option value="waiting">Waiting list</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-accent hover:bg-accent-dark text-black py-3 rounded-xl font-bold transition-all mt-4"
                        >
                            Save Evaluation
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
