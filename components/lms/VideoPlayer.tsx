'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiPlay, FiPause, FiCheckCircle, FiRotateCcw, FiArrowRight,
    FiMaximize, FiMinimize, FiVolume2, FiVolumeX, FiX, FiAlertCircle
} from 'react-icons/fi';

interface VideoPlayerProps {
    videoId: string; // Internal DB _id
    youtubeId: string;
    title: string;
    instructor?: string;
    description?: string;
    initialWatchedDuration?: number;
    completed?: boolean;
    studentName?: string;
    studentEmail?: string;
    onCompleted?: () => void;
    onNextLecture?: () => void;
    onClose?: () => void;
    hasNextLecture?: boolean;
}

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: any;
    }
}

export default function VideoPlayer({
    videoId,
    youtubeId,
    title,
    instructor,
    description,
    initialWatchedDuration = 0,
    completed = false,
    studentName = 'Student',
    studentEmail = 'Student ID: ST-Active',
    onCompleted,
    onNextLecture,
    onClose,
    hasNextLecture = false,
}: VideoPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<any>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialWatchedDuration);
    const [duration, setDuration] = useState(0);
    const [isCompleted, setIsCompleted] = useState(completed);
    const [showEndOverlay, setShowEndOverlay] = useState(false);
    const [watermarkPos, setWatermarkPos] = useState(0); // 0: top-left, 1: top-right, 2: bottom-right, 3: bottom-left
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [origin, setOrigin] = useState('');

    // Update origin on mount for YouTube security parameter
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    // Watermark position rotation timer (every 20s)
    useEffect(() => {
        const interval = setInterval(() => {
            setWatermarkPos((prev) => (prev + 1) % 4);
        }, 20000);
        return () => clearInterval(interval);
    }, []);

    // Load YouTube Iframe API
    useEffect(() => {
        let isMounted = true;

        const initPlayer = () => {
            if (!window.YT || !window.YT.Player || !iframeRef.current) return;
            try {
                playerRef.current = new window.YT.Player(iframeRef.current, {
                    events: {
                        onReady: (event: any) => {
                            if (!isMounted) return;
                            const dur = event.target.getDuration();
                            setDuration(dur);

                            // Auto seek to initial watched duration if available
                            if (initialWatchedDuration > 5 && dur > 0 && initialWatchedDuration < dur - 10) {
                                event.target.seekTo(initialWatchedDuration, true);
                            }
                        },
                        onStateChange: (event: any) => {
                            if (!isMounted) return;
                            // YT.PlayerState: ENDED (0), PLAYING (1), PAUSED (2)
                            if (event.data === 1) {
                                setIsPlaying(true);
                                setShowEndOverlay(false);
                            } else if (event.data === 2) {
                                setIsPlaying(false);
                            } else if (event.data === 0) {
                                setIsPlaying(false);
                                setShowEndOverlay(true);
                                handleMarkCompleted();
                            }
                        },
                    },
                });
            } catch (err) {
                console.error('YouTube player init error:', err);
            }
        };

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = () => {
                initPlayer();
            };
        } else {
            initPlayer();
        }

        return () => {
            isMounted = false;
        };
    }, [youtubeId]);

    // Progress update loop (every 5 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                try {
                    const time = Math.floor(playerRef.current.getCurrentTime());
                    const dur = Math.floor(playerRef.current.getDuration() || duration);
                    if (time > 0) {
                        setCurrentTime(time);
                        if (dur > 0) setDuration(dur);
                        saveProgress(time, dur);
                    }
                } catch { }
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [videoId, duration]);

    const saveProgress = async (time: number, dur: number) => {
        try {
            const is90Percent = dur > 0 && time / dur >= 0.9;
            const token = localStorage.getItem('token');
            await fetch('/api/lms/videos/progress', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId,
                    watchedDuration: time,
                    completed: isCompleted || is90Percent,
                }),
            });

            if (is90Percent && !isCompleted) {
                setIsCompleted(true);
                if (onCompleted) onCompleted();
            }
        } catch { }
    };

    const handleMarkCompleted = async () => {
        setIsCompleted(true);
        if (onCompleted) onCompleted();
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/lms/videos/progress', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoId,
                    watchedDuration: duration || currentTime,
                    completed: true,
                }),
            });
        } catch { }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore shortcuts if user is typing in an input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                seekRelative(5);
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                seekRelative(-5);
            } else if (e.code === 'KeyM') {
                e.preventDefault();
                toggleMute();
            } else if (e.code === 'KeyF') {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying]);

    const togglePlay = () => {
        if (!playerRef.current) return;
        try {
            if (isPlaying) {
                playerRef.current.pauseVideo();
            } else {
                playerRef.current.playVideo();
            }
        } catch { }
    };

    const seekRelative = (seconds: number) => {
        if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
        try {
            const curr = playerRef.current.getCurrentTime();
            playerRef.current.seekTo(curr + seconds, true);
        } catch { }
    };

    const toggleMute = () => {
        if (!playerRef.current || typeof playerRef.current.isMuted !== 'function') return;
        try {
            if (playerRef.current.isMuted()) {
                playerRef.current.unMute();
            } else {
                playerRef.current.mute();
            }
        } catch { }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(() => { });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(() => { });
            setIsFullscreen(false);
        }
    };

    const replayVideo = () => {
        setShowEndOverlay(false);
        if (playerRef.current) {
            try {
                playerRef.current.seekTo(0, true);
                playerRef.current.playVideo();
            } catch { }
        }
    };

    // Watermark position styles
    const watermarkClasses = [
        'top-4 left-4',
        'top-4 right-4',
        'bottom-16 right-4',
        'bottom-16 left-4',
    ];

    const embedUrl = `https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1&autoplay=1${origin ? `&origin=${encodeURIComponent(origin)}` : ''
        }`;

    return (
        <div
            ref={containerRef}
            onContextMenu={(e) => e.preventDefault()}
            className="relative w-full bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 select-none group"
        >
            {/* Main Video IFrame */}
            <div className="relative aspect-video w-full bg-black overflow-hidden">
                <iframe
                    ref={iframeRef}
                    id={`yt-player-${videoId}`}
                    src={embedUrl}
                    title={title}
                    className="w-full h-full border-0 pointer-events-auto"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                />

                {/* Floating Dynamic Watermark */}
                <div
                    className={`absolute ${watermarkClasses[watermarkPos]} pointer-events-none transition-all duration-1000 z-30 opacity-40 hover:opacity-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white font-mono text-[11px] flex items-center gap-2`}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>{studentName}</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-400">{studentEmail}</span>
                </div>

                {/* Custom Lecture Completion Overlay (Covers YouTube Recommended Videos) */}
                <AnimatePresence>
                    {showEndOverlay && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-40 bg-[#07111F]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                        >
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center justify-center mb-4"
                            >
                                <FiCheckCircle className="w-8 h-8" />
                            </motion.div>

                            <h3 className="text-2xl font-black text-white mb-2">المحاضرة مكتملة!</h3>
                            <p className="text-gray-400 text-sm max-w-md mb-6">
                                أحسنت! لقد شاهدت هذه المحاضرة بنجاح وتم تسجيل تقدمك الإنجازي في التراك.
                            </p>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {hasNextLecture && onNextLecture && (
                                    <button
                                        onClick={onNextLecture}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                                    >
                                        <span>المحاضرة التالية</span>
                                        <FiArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={replayVideo}
                                    className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-bold text-sm border border-white/10 transition-all"
                                >
                                    <FiRotateCcw className="w-4 h-4" />
                                    <span>إعادة المشاهدة</span>
                                </button>
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl font-bold text-sm border border-white/5 transition-all"
                                    >
                                        <span>إغلاق المحاضرة</span>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Video Info Header & Secondary Action Controls Bar */}
            <div className="p-6 bg-[#0B1220] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-white/5">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full">
                            Switch Code Lecture
                        </span>
                        {isCompleted && (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-full">
                                <FiCheckCircle className="w-3 h-3" /> مكتملة
                            </span>
                        )}
                    </div>
                    <h2 className="text-lg font-bold text-white leading-snug line-clamp-1">{title}</h2>
                    {instructor && <p className="text-gray-400 text-xs mt-1">المحاضر: {instructor}</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {!isCompleted && (
                        <button
                            onClick={handleMarkCompleted}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl font-bold text-xs transition-all"
                        >
                            <FiCheckCircle className="w-4 h-4" />
                            <span>تحديد كمكتملة</span>
                        </button>
                    )}
                    {hasNextLecture && onNextLecture && (
                        <button
                            onClick={onNextLecture}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-bold text-xs transition-all"
                        >
                            <span>التالي</span>
                            <FiArrowRight className="w-4 h-4" />
                        </button>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
