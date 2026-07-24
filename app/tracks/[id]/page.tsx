'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiBook, FiClock, FiLock, FiChevronRight, FiCheckCircle, FiPlayCircle, FiInfo, FiAward, FiArrowRight } from 'react-icons/fi';

interface Lesson {
    title: string;
    description: string;
    videoUrl: string;
}

interface Track {
    _id: string;
    title: string;
    description: string;
    lessons: Lesson[];
    duration: string;
    level: string;
    exams?: any[];
}

export default function TrackDetail() {
    const [track, setTrack] = useState<Track | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        const fetchTrackData = async () => {
            try {
                const res = await fetch(`/api/tracks/${params.id}`);
                const data = await res.json();
                if (res.ok) {
                    setTrack(data);
                    if (data.lessons && data.lessons.length > 0) {
                        setActiveLesson(data.lessons[0]);
                    }
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};

        if (!token || (user.role !== 'student' && user.role !== 'admin')) {
            router.push('/login');
        } else {
            setAuthorized(true);
            fetchTrackData();
        }
    }, [params.id, router]);

    const getDailymotionId = (url: string) => {
        if (!url) return '';
        const match = url.match(/(?:dailymotion\.com(?:\/video|\/embed\/video)|\/dai\.ly)\/([a-zA-Z0-9]+)/);
        return match ? match[1] : url;
    };

    if (loading) return (
        <div className="min-h-screen bg-dark flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
        </div>
    );

    if (!authorized || !track) return null;

    return (
        <div className="min-h-screen bg-dark text-white pt-20 pb-12">
            <div className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Player Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative group"
                        >
                            <AnimatePresence mode="wait">
                                {activeLesson ? (
                                    <motion.iframe
                                        key={activeLesson.videoUrl}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        src={`https://www.dailymotion.com/embed/video/${getDailymotionId(activeLesson.videoUrl)}?autoplay=1&ui-start-screen-info=0&ui-logo=0`}
                                        className="w-full h-full border-none"
                                        allowFullScreen
                                        allow="autoplay; fullscreen"
                                    ></motion.iframe>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500">
                                        Select a lesson to start learning
                                    </div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass p-8 rounded-3xl border border-white/5"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <h1 className="text-3xl font-bold">{activeLesson?.title || track.title}</h1>
                            </div>
                            <p className="text-gray-400 leading-relaxed min-h-[100px]">
                                {activeLesson?.description || track.description}
                            </p>

                            <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-white/5">
                                <div className="flex items-center text-gray-400">
                                    <FiClock className="mr-2 text-primary" />
                                    <span className="text-sm font-medium">{track.duration} Total</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <FiBook className="mr-2 text-primary" />
                                    <span className="text-sm font-medium">{track.lessons.length} Lessons</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                    <FiCheckCircle className="mr-2 text-primary" />
                                    <span className="text-sm font-medium capitalize">{track.level}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar / Curriculum */}
                    <div className="lg:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass rounded-3xl border border-white/5 overflow-hidden sticky top-24"
                        >
                            <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center">
                                    <FiPlayCircle className="mr-3 text-accent" /> Syllabus
                                </h3>
                                <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-md font-bold">
                                    {track.lessons.length} VIDEOS
                                </span>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {track.lessons.map((lesson, idx) => {
                                    const isActive = activeLesson?.videoUrl === lesson.videoUrl;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveLesson(lesson)}
                                            className={`w-full p-5 flex items-start text-left transition-all border-b border-white/5 last:border-0 relative group ${isActive ? 'bg-primary/10' : 'hover:bg-white/5'
                                                }`}
                                        >
                                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                                            <div className={`mr-4 mt-1 flex-shrink-0 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                                                {isActive ? <FiPlay className="animate-pulse" /> : <FiLock className="opacity-50" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
                                                    {idx + 1}. {lesson.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 mt-1 truncate">
                                                    Lesson {idx + 1}
                                                </p>
                                            </div>
                                            <FiChevronRight className={`ml-2 mt-1 transition-transform group-hover:translate-x-1 ${isActive ? 'text-primary' : 'text-gray-600'}`} />
                                        </button>
                                    );
                                })}

                                {/* Exams Section */}
                                {track.exams && track.exams.length > 0 && (
                                    <div className="mt-2">
                                        <div className="px-5 py-3 bg-white/[0.02] border-y border-white/5 text-[10px] font-black tracking-[0.2em] text-accent uppercase">
                                            Track Assessments
                                        </div>
                                        {track.exams.map((exam, idx) => (
                                            <Link
                                                key={exam._id}
                                                href={`/exams/${exam._id}`}
                                                className="w-full p-5 flex items-start text-left transition-all border-b border-white/5 last:border-0 hover:bg-accent/5 focus:bg-accent/10 group"
                                            >
                                                <div className="mr-4 mt-1 flex-shrink-0 text-accent group-hover:scale-110 transition-transform">
                                                    <FiAward />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-bold truncate text-white">
                                                        {exam.title}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 mt-1 font-black uppercase tracking-wider">
                                                        {exam.duration} Min • {exam.questions?.length || 0} Qs
                                                    </p>
                                                </div>
                                                <FiArrowRight className="ml-2 mt-1 -rotate-45 text-accent opacity-0 group-hover:opacity-100 transition-all" />
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-primary/10 to-transparent"
                        >
                            <div className="flex items-center mb-3">
                                <FiInfo className="text-primary mr-2" />
                                <h4 className="font-bold">Access Support</h4>
                            </div>
                            <p className="text-xs text-gray-400 mb-4">
                                Having issues with the content? Reach out via the contact form and our team will assist you.
                            </p>
                            <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold transition-all border border-white/10">
                                Help Center
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
