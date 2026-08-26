'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBookOpen, FiYoutube, FiFileText, FiCheckSquare, FiClipboard,
    FiTrendingUp, FiClock, FiAward, FiChevronRight, FiRefreshCw,
    FiTarget, FiAlertCircle, FiX
} from 'react-icons/fi';
import Link from 'next/link';

interface Track {
    _id: string;
    name: string;
    description: string;
    category: string;
    level: string;
    duration: string;
    thumbnail?: string;
}

interface Progress {
    overall: number;
    videos: { completed: number; total: number };
    materials: { completed: number; total: number };
    quizzes: { completed: number; total: number };
    assignments: { completed: number; total: number };
    avgQuizScore: number;
    upcomingAssignments: { _id: string; title: string; deadline?: string }[];
}

export default function LearnPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [enrolled, setEnrolled] = useState(false);
    const [track, setTrack] = useState<Track | null>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [showTrackPicker, setShowTrackPicker] = useState(false);
    const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
    const [tracksLoading, setTracksLoading] = useState(false);
    const [enrolling, setEnrolling] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setUser(JSON.parse(userStr));
        }
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            const res = await fetch('/api/lms/progress', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });

            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'فشل في تحميل تقدم التراك');
            }

            setEnrolled(!!data.enrolled);
            if (data.enrolled) {
                setTrack(data.track);
                setProgress(data.progress);
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    const openTrackPicker = async () => {
        setShowTrackPicker(true);
        setTracksLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lms/tracks', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setAvailableTracks(data.tracks || []);
        } catch {
            setAvailableTracks([]);
        } finally {
            setTracksLoading(false);
        }
    };

    const enrollInTrack = async (trackId: string) => {
        setEnrolling(trackId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lms/enrollment', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId }),
            });
            if (res.ok) {
                setShowTrackPicker(false);
                await fetchProgress();
            }
        } catch { }
        finally {
            setEnrolling(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-400 font-medium">Loading your learning dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <p className="text-gray-300 font-medium">{error}</p>
                    <button
                        onClick={fetchProgress}
                        className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold text-sm hover:bg-cyan-500/20 transition-all"
                    >
                        <FiRefreshCw className="w-4 h-4" /> Retry
                    </button>
                </div>
            </div>
        );
    }

    const navItems = [
        { title: 'Video Lectures', icon: FiYoutube, link: '/learn/videos', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', stat: progress ? `${progress.videos.completed}/${progress.videos.total}` : null },
        { title: 'Reading Materials', icon: FiFileText, link: '/learn/materials', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', stat: progress ? `${progress.materials.completed}/${progress.materials.total}` : null },
        { title: 'Quizzes', icon: FiCheckSquare, link: '/learn/quizzes', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', stat: progress ? `${progress.quizzes.completed}/${progress.quizzes.total}` : null },
        { title: 'Assignments', icon: FiClipboard, link: '/learn/assignments', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', stat: progress ? `${progress.assignments.completed}/${progress.assignments.total}` : null },
    ];

    return (
        <div className="min-h-screen bg-[#07111F] text-white py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
                    <div className="relative z-10">
                        <div className="inline-flex items-center bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-bold text-cyan-400 mb-2">
                            Switch Code LMS
                        </div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <FiBookOpen className="text-cyan-400" />
                            Technical Learning Portal
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {enrolled ? `Enrolled in: ${track?.name}` : 'Choose your learning track to get started'}
                        </p>
                    </div>
                    <div className="relative z-10 flex gap-3">
                        <button
                            onClick={openTrackPicker}
                            className="px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 rounded-xl font-bold text-xs text-cyan-400 transition-all flex items-center gap-2"
                        >
                            <FiTarget className="w-4 h-4" />
                            {enrolled ? 'Switch Track' : 'Choose Track'}
                        </button>
                    </div>
                </div>

                {/* No track enrolled */}
                {!enrolled && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5"
                    >
                        <FiTarget className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Please Select a Track</h2>
                        <p className="text-gray-400 mb-6">Choose your learning track to access videos, materials, quizzes, and assignments.</p>
                        <button
                            onClick={openTrackPicker}
                            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            Choose Track
                        </button>
                    </motion.div>
                )}

                {/* Progress Overview */}
                {enrolled && progress && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                        {/* Track progress bar */}
                        <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 p-8 rounded-3xl border border-cyan-500/10">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-white">{track?.name}</h2>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {track?.category} • {track?.level} • {track?.duration}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-4xl font-extrabold text-cyan-400">{progress.overall}%</span>
                                    <p className="text-xs text-gray-500 uppercase font-bold mt-1">Overall Progress</p>
                                </div>
                            </div>
                            <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress.overall}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                                />
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                {[
                                    { label: 'Videos', val: `${progress.videos.completed}/${progress.videos.total}`, color: 'text-red-400' },
                                    { label: 'Materials', val: `${progress.materials.completed}/${progress.materials.total}`, color: 'text-blue-400' },
                                    { label: 'Quizzes', val: `${progress.quizzes.completed}/${progress.quizzes.total}`, color: 'text-yellow-400' },
                                    { label: 'Assignments', val: `${progress.assignments.completed}/${progress.assignments.total}`, color: 'text-green-400' },
                                ].map(s => (
                                    <div key={s.label} className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                                        <span className={`text-lg font-extrabold ${s.color}`}>{s.val}</span>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mt-1">{s.label} Completed</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Avg Quiz Score + Upcoming */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5 flex items-center gap-4">
                                <div className="p-4 bg-yellow-500/10 rounded-2xl">
                                    <FiAward className="w-8 h-8 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-extrabold text-white">{progress.avgQuizScore}%</p>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Average Quiz Score</p>
                                </div>
                            </div>

                            {progress.upcomingAssignments.length > 0 && (
                                <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/5 space-y-3">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                        <FiClock className="text-orange-400" /> Upcoming Deadlines
                                    </h3>
                                    {progress.upcomingAssignments.map(a => (
                                        <div key={a._id} className="flex items-center justify-between">
                                            <span className="text-sm text-white font-medium truncate">{a.title}</span>
                                            {a.deadline && (
                                                <span className="text-xs text-orange-400 font-bold whitespace-nowrap ml-2">
                                                    {new Date(a.deadline).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Navigation Cards */}
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FiTrendingUp className="text-cyan-400" /> My Learning Content
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
                                {navItems.map(item => (
                                    <Link
                                        key={item.title}
                                        href={item.link}
                                        className={`group bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all hover:scale-[1.02] flex flex-col gap-4`}
                                    >
                                        <div className={`w-12 h-12 ${item.bg} ${item.border} border rounded-xl flex items-center justify-center`}>
                                            <item.icon className={`w-6 h-6 ${item.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-base">{item.title}</h3>
                                            {item.stat && (
                                                <p className={`text-sm font-bold mt-1 ${item.color}`}>{item.stat} completed</p>
                                            )}
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-bold ${item.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            Go to {item.title} <FiChevronRight className="w-3 h-3" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Track Picker Modal */}
            <AnimatePresence>
                {showTrackPicker && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1220] w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-3xl p-8 border border-cyan-500/20 shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Choose Your Track</h2>
                                    <p className="text-gray-400 text-sm mt-1">Select a learning path to begin your journey</p>
                                </div>
                                <button
                                    onClick={() => setShowTrackPicker(false)}
                                    className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {tracksLoading ? (
                                <div className="text-center py-12">
                                    <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                                    <p className="text-gray-400 mt-3 text-sm">Loading tracks...</p>
                                </div>
                            ) : availableTracks.length === 0 ? (
                                <div className="text-center py-12">
                                    <FiBookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400">No tracks available yet. Check back later.</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {availableTracks.map(t => (
                                        <motion.button
                                            key={t._id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => enrollInTrack(t._id)}
                                            disabled={enrolling === t._id}
                                            className={`text-left p-6 rounded-2xl border transition-all ${track?._id === t._id
                                                ? 'border-cyan-500/50 bg-cyan-500/10'
                                                : 'border-white/10 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-cyan-500/5'
                                                } ${enrolling === t._id ? 'opacity-70' : ''}`}
                                        >
                                            {t.thumbnail && (
                                                <img src={t.thumbnail} alt={t.name} className="w-full h-24 object-cover rounded-xl mb-4 opacity-80" />
                                            )}
                                            <h3 className="font-bold text-white text-base mb-1">{t.name}</h3>
                                            <p className="text-gray-400 text-xs line-clamp-2 mb-3">{t.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-xs px-2.5 py-1 bg-cyan-500/10 text-cyan-400 rounded-full font-bold">{t.level}</span>
                                                <span className="text-xs px-2.5 py-1 bg-white/5 text-gray-400 rounded-full">{t.category}</span>
                                                {t.duration && (
                                                    <span className="text-xs px-2.5 py-1 bg-white/5 text-gray-400 rounded-full">{t.duration}</span>
                                                )}
                                            </div>
                                            {track?._id === t._id && (
                                                <div className="mt-3 text-xs font-bold text-cyan-400 flex items-center gap-1">
                                                    ✓ Currently Enrolled
                                                </div>
                                            )}
                                            {enrolling === t._id && (
                                                <div className="mt-3 text-xs text-gray-400">Enrolling...</div>
                                            )}
                                        </motion.button>
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
