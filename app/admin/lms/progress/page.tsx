'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiSearch, FiX, FiTrendingUp, FiYoutube, FiFileText, FiCheckSquare, FiClipboard } from 'react-icons/fi';

interface Enrollment {
    _id: string;
    userId: { _id: string; name: string; email: string };
    trackId: { _id: string; name: string };
    enrollmentDate: string;
    status: string;
}

interface StudentProgress {
    student: { _id: string; name: string; email: string; role: string };
    enrolled: boolean;
    track?: { _id: string; name: string; category: string; level: string };
    progress?: {
        overall: number;
        videos: { completed: number; total: number };
        materials: { completed: number; total: number };
        quizzes: { completed: number; total: number };
        assignments: { completed: number; total: number };
        avgQuizScore: number;
    };
}

export default function AdminLMSProgress() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
    const [progressLoading, setProgressLoading] = useState(false);

    useEffect(() => { fetchEnrollments(); }, []);

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lms/progress/admin', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setEnrollments(data.enrollments || []);
        } catch { }
        finally { setLoading(false); }
    };

    const fetchStudentProgress = async (studentId: string) => {
        setSelectedStudent(studentId);
        setProgressLoading(true);
        setStudentProgress(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/lms/progress/admin?studentId=${studentId}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setStudentProgress(data);
        } catch { }
        finally { setProgressLoading(false); }
    };

    const filtered = enrollments.filter(e =>
        !search || e.userId?.name?.toLowerCase().includes(search.toLowerCase()) || e.userId?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Student Progress</h1>
                <p className="text-gray-400 text-sm mt-1">{enrollments.length} enrolled students</p>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-blue-500/30" />
            </div>

            {/* Enrollments Table */}
            <div className="bg-[#0B1220] rounded-2xl border border-blue-500/20 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {['Student', 'Email', 'Track', 'Enrolled Date', 'Status', 'View Progress'].map(h => (
                                <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-500">No enrolled students</td></tr>
                        ) : (
                            filtered.map(e => (
                                <tr key={e._id} className="hover:bg-white/[0.02]">
                                    <td className="px-5 py-4 font-bold text-white text-sm">{e.userId?.name}</td>
                                    <td className="px-5 py-4 text-sm text-gray-400">{e.userId?.email}</td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-full font-bold">{e.trackId?.name}</span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500">{new Date(e.enrollmentDate).toLocaleDateString()}</td>
                                    <td className="px-5 py-4">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${e.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>{e.status}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button onClick={() => fetchStudentProgress(e.userId?._id)} className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                                            <FiTrendingUp className="w-3.5 h-3.5" /> View →
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Student Progress Detail Modal */}
            <AnimatePresence>
                {selectedStudent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1220] w-full max-w-2xl rounded-3xl p-8 border border-blue-500/30 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Student Progress</h2>
                                <button onClick={() => { setSelectedStudent(null); setStudentProgress(null); }} className="p-2 hover:bg-white/5 rounded-xl text-gray-400"><FiX className="w-5 h-5" /></button>
                            </div>

                            {progressLoading ? (
                                <div className="text-center py-12">
                                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
                                    <p className="text-gray-400 mt-3 text-sm">Loading progress...</p>
                                </div>
                            ) : studentProgress ? (
                                <div className="space-y-6">
                                    {/* Student Info */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                                            <FiUsers className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-lg">{studentProgress.student.name}</p>
                                            <p className="text-gray-400 text-sm">{studentProgress.student.email}</p>
                                            <p className="text-gray-500 text-xs capitalize">{studentProgress.student.role}</p>
                                        </div>
                                    </div>

                                    {!studentProgress.enrolled ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Student has not enrolled in any track yet</p>
                                        </div>
                                    ) : studentProgress.progress && (
                                        <>
                                            {/* Track */}
                                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Current Track</p>
                                                <p className="font-bold text-white text-base">{studentProgress.track?.name}</p>
                                                <p className="text-gray-400 text-xs">{studentProgress.track?.category} • {studentProgress.track?.level}</p>
                                            </div>

                                            {/* Overall Progress */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-bold text-white">Overall Progress</span>
                                                    <span className="text-cyan-400 font-extrabold text-lg">{studentProgress.progress.overall}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${studentProgress.progress.overall}%` }}
                                                        transition={{ duration: 1 }}
                                                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                {[
                                                    { label: 'Videos', icon: FiYoutube, val: `${studentProgress.progress.videos.completed}/${studentProgress.progress.videos.total}`, color: 'text-red-400', bg: 'bg-red-500/10' },
                                                    { label: 'Materials', icon: FiFileText, val: `${studentProgress.progress.materials.completed}/${studentProgress.progress.materials.total}`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                                                    { label: 'Quizzes Passed', icon: FiCheckSquare, val: `${studentProgress.progress.quizzes.completed}/${studentProgress.progress.quizzes.total}`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                                                    { label: 'Assignments', icon: FiClipboard, val: `${studentProgress.progress.assignments.completed}/${studentProgress.progress.assignments.total}`, color: 'text-green-400', bg: 'bg-green-500/10' },
                                                ].map(s => (
                                                    <div key={s.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                                                        <div className={`p-2.5 ${s.bg} rounded-xl`}>
                                                            <s.icon className={`w-5 h-5 ${s.color}`} />
                                                        </div>
                                                        <div>
                                                            <p className={`font-extrabold text-base ${s.color}`}>{s.val}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase font-bold">{s.label}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Avg Quiz Score */}
                                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                                                <span className="text-sm font-bold text-gray-300">Average Quiz Score</span>
                                                <span className={`text-xl font-extrabold ${studentProgress.progress.avgQuizScore >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {studentProgress.progress.avgQuizScore}%
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">Failed to load progress</div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
