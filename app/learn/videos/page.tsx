'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiYoutube, FiPlay, FiCheckCircle, FiClock, FiAlertCircle,
    FiRefreshCw, FiArrowLeft, FiTarget, FiX, FiShield, FiLock
} from 'react-icons/fi';
import Link from 'next/link';
import VideoPlayer from '@/components/lms/VideoPlayer';

interface Video {
    _id: string;
    title: string;
    description: string;
    thumbnail?: string;
    youtubeId: string;
    instructor: string;
    duration: string;
    order: number;
    progress?: {
        completed: boolean;
        watchedDuration: number;
        lastWatchedAt: string;
    } | null;
}

interface StudentInfo {
    name: string;
    email: string;
}

export default function VideosPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [student, setStudent] = useState<StudentInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [noTrack, setNoTrack] = useState(false);
    const [trackInactive, setTrackInactive] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        setLoading(true);
        setError('');
        setNoTrack(false);
        setTrackInactive(false);
        setAccessDenied(false);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lms/videos', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });

            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (res.status === 403) {
                setAccessDenied(true);
                return;
            }

            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            if (data.noTrack) {
                setNoTrack(true);
                return;
            }
            if (data.trackInactive) {
                setTrackInactive(true);
                return;
            }

            setVideos(data.videos || []);
            setStudent(data.student || null);
        } catch (err: any) {
            setError('حدث خطأ أثناء تحميل المحاضرات المرئية');
        } finally {
            setLoading(false);
        }
    };

    const handleVideoCompleted = (videoId: string) => {
        setVideos((prev) =>
            prev.map((v) =>
                v._id === videoId
                    ? {
                        ...v,
                        progress: {
                            completed: true,
                            watchedDuration: v.progress?.watchedDuration || 0,
                            lastWatchedAt: new Date().toISOString(),
                        },
                    }
                    : v
            )
        );
    };

    const activeVideo = activeVideoIndex !== null ? videos[activeVideoIndex] : null;
    const hasNextLecture = activeVideoIndex !== null && activeVideoIndex < videos.length - 1;

    const handleNextLecture = () => {
        if (hasNextLecture && activeVideoIndex !== null) {
            setActiveVideoIndex(activeVideoIndex + 1);
        }
    };

    const formatSeconds = (sec?: number) => {
        if (!sec) return '0:00';
        const mins = Math.floor(sec / 60);
        const remainingSecs = Math.floor(sec % 60);
        return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07111F] py-10 px-4 md:px-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="h-8 w-48 bg-white/5 rounded-xl animate-pulse" />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-64 bg-white/[0.02] border border-white/5 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-md bg-white/[0.02] border border-red-500/20 p-8 rounded-3xl">
                    <FiLock className="w-16 h-16 text-red-400 mx-auto" />
                    <h2 className="text-xl font-bold text-white">Access Denied</h2>
                    <p className="text-gray-400 text-sm">حسابك غير مفعل أو ليس لديك صلاحية لمشاهدة هذا المحتوى التعليمي.</p>
                    <Link href="/learn" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-all">
                        <FiArrowLeft className="w-4 h-4" /> العودة للرئيسية
                    </Link>
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
                    <button onClick={fetchVideos} className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-all">
                        <FiRefreshCw className="w-4 h-4" /> إعادة المحاولة
                    </button>
                </div>
            </div>
        );
    }

    if (noTrack || trackInactive) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-md">
                    <FiTarget className="w-16 h-16 text-gray-600 mx-auto" />
                    <h2 className="text-xl font-bold text-white">
                        {trackInactive ? 'التراك غير نشط حالياً' : 'لم يتم اختيار تراك تعليمي'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {trackInactive
                            ? 'يرجى التواصل مع إدارة المنصة لتفعيل التراك الخاص بك.'
                            : 'يرجى الاشتراك أو اختيار تراك تعليمي للوصول للمحاضرات المرئية.'}
                    </p>
                    <Link href="/learn" className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-all">
                        <FiTarget className="w-4 h-4" /> تصفح التراكات
                    </Link>
                </div>
            </div>
        );
    }

    const completedCount = videos.filter((v) => v.progress?.completed).length;
    const progressPercent = videos.length > 0 ? Math.round((completedCount / videos.length) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#07111F] text-white py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link href="/learn" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3 transition-colors">
                            <FiArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <FiYoutube className="text-red-500" /> Video Lectures
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            {completedCount} / {videos.length} videos completed
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <span className="text-2xl font-extrabold text-red-500">{progressPercent}%</span>
                            <p className="text-xs text-gray-500 uppercase font-bold">Completed</p>
                        </div>
                    </div>
                </div>

                {/* Overall Track Progress Bar */}
                {videos.length > 0 && (
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                        />
                    </div>
                )}

                {/* Empty State */}
                {videos.length === 0 && (
                    <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
                        <FiYoutube className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">لا توجد محاضرات متاحة</h2>
                        <p className="text-gray-400 text-sm">لم يتم نشر محاضرات مرئية في هذا التراك حتى الآن.</p>
                    </div>
                )}

                {/* Videos Grid */}
                {videos.length > 0 && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((video, idx) => {
                            const isDone = video.progress?.completed;
                            const hasWatched = !isDone && (video.progress?.watchedDuration || 0) > 5;

                            return (
                                <motion.div
                                    key={video._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className={`group bg-white/[0.02] rounded-2xl border overflow-hidden hover:scale-[1.01] transition-all cursor-pointer ${isDone ? 'border-green-500/30' : 'border-white/5 hover:border-red-500/30'
                                        }`}
                                    onClick={() => setActiveVideoIndex(idx)}
                                >
                                    {/* Thumbnail Area */}
                                    <div className="relative aspect-video bg-black/60 overflow-hidden">
                                        {video.thumbnail ? (
                                            <img
                                                src={video.thumbnail}
                                                alt={video.title}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FiYoutube className="w-12 h-12 text-gray-600" />
                                            </div>
                                        )}

                                        {/* Play Overlay Button */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isDone
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-red-600 text-white group-hover:scale-110'
                                                    }`}
                                            >
                                                {isDone ? <FiCheckCircle className="w-6 h-6" /> : <FiPlay className="w-6 h-6 mr-0.5" />}
                                            </div>
                                        </div>

                                        {/* Status Badges */}
                                        {isDone && (
                                            <div className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
                                                ✓ مكتملة
                                            </div>
                                        )}

                                        {hasWatched && (
                                            <div className="absolute top-3 left-3 bg-yellow-500 text-black text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
                                                متابعة ({formatSeconds(video.progress?.watchedDuration)})
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Card Info */}
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-2 mb-1.5">
                                            <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">{video.title}</h3>
                                            <span className="text-[10px] text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-full shrink-0 font-mono">
                                                #{video.order + 1}
                                            </span>
                                        </div>

                                        {video.description && (
                                            <p className="text-gray-400 text-xs line-clamp-2 mt-1 mb-3">{video.description}</p>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-white/5">
                                            <span>{video.instructor}</span>
                                            {video.duration && (
                                                <span className="flex items-center gap-1">
                                                    <FiClock className="w-3.5 h-3.5" /> {video.duration}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Video Player Modal */}
            <AnimatePresence>
                {activeVideo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-5xl my-auto"
                        >
                            <VideoPlayer
                                videoId={activeVideo._id}
                                youtubeId={activeVideo.youtubeId}
                                title={activeVideo.title}
                                instructor={activeVideo.instructor}
                                description={activeVideo.description}
                                initialWatchedDuration={activeVideo.progress?.watchedDuration || 0}
                                completed={activeVideo.progress?.completed || false}
                                studentName={student?.name || 'Student'}
                                studentEmail={student?.email || 'Switch Code Student'}
                                onCompleted={() => handleVideoCompleted(activeVideo._id)}
                                onNextLecture={handleNextLecture}
                                onClose={() => setActiveVideoIndex(null)}
                                hasNextLecture={hasNextLecture}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

