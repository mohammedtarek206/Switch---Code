'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight, FiImage, FiRefreshCw } from 'react-icons/fi';

// ─────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────
function Skeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-2xl bg-slate-800/60 animate-pulse"
                    style={{ height: `${180 + (i % 3) * 60}px` }}
                />
            ))}
        </div>
    );
}

// ─────────────────────────────────────────
// Lightbox
// ─────────────────────────────────────────
function Lightbox({ images, initialIndex, onClose }: { images: any[]; initialIndex: number; onClose: () => void }) {
    const [idx, setIdx] = useState(initialIndex);
    const img = images[idx];

    const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, prev, next]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
            onClick={onClose}
        >
            {/* Close */}
            <button
                className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                onClick={onClose}
            >
                <FiX className="w-5 h-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 z-10 text-white/60 text-xs font-bold uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-full backdrop-blur">
                {idx + 1} / {images.length}
            </div>

            {/* Prev */}
            <button
                className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                onClick={e => { e.stopPropagation(); prev(); }}
            >
                <FiChevronLeft className="w-6 h-6" />
            </button>

            {/* Image */}
            <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative max-w-5xl w-full max-h-[80vh] flex flex-col items-center"
                onClick={e => e.stopPropagation()}
            >
                <img
                    src={img.imageUrl}
                    alt={img.altText || img.title || 'Event photo'}
                    className="max-h-[72vh] max-w-full object-contain rounded-2xl shadow-2xl"
                    loading="lazy"
                />
                {(img.caption || img.title) && (
                    <div className="mt-4 text-center">
                        {img.title && <p className="text-white font-bold text-base">{img.title}</p>}
                        {img.caption && <p className="text-slate-400 text-sm mt-1">{img.caption}</p>}
                    </div>
                )}
            </motion.div>

            {/* Next */}
            <button
                className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                onClick={e => { e.stopPropagation(); next(); }}
            >
                <FiChevronRight className="w-6 h-6" />
            </button>
        </motion.div>
    );
}

// ─────────────────────────────────────────
// Main Gallery Page
// ─────────────────────────────────────────
export default function EventGalleryPage() {
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState('all');
    const [lightbox, setLightbox] = useState<{ images: any[]; index: number } | null>(null);

    const fetchGallery = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/events/gallery', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to load gallery');
            const data = await res.json();
            setImages(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchGallery(); }, [fetchGallery]);

    // Unique events from image list
    const events = useMemo(() => {
        const map = new Map<string, any>();
        images.forEach(img => {
            if (img.eventId?._id && !map.has(img.eventId._id)) {
                map.set(img.eventId._id, img.eventId);
            }
        });
        return Array.from(map.values());
    }, [images]);

    // Filtered + grouped
    const filtered = useMemo(() => {
        if (selectedEvent === 'all') return images;
        return images.filter(img => img.eventId?._id === selectedEvent);
    }, [images, selectedEvent]);

    const grouped = useMemo(() => {
        const groups = new Map<string, { event: any; images: any[] }>();
        filtered.forEach(img => {
            const key = img.eventId?._id || 'misc';
            if (!groups.has(key)) {
                groups.set(key, { event: img.eventId || { _id: 'misc', title: 'General' }, images: [] });
            }
            groups.get(key)!.images.push(img);
        });
        return Array.from(groups.values());
    }, [filtered]);

    const openLightbox = (groupImages: any[], index: number) => {
        setLightbox({ images: groupImages, index });
    };

    return (
        <div className="min-h-screen bg-[#07111F] text-white">
            {/* Hero */}
            <div className="relative overflow-hidden pt-28 pb-16 px-6 text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full" />
                </div>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                    >
                        <FiImage className="w-3 h-3" /> Switch Code
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-4"
                    >
                        Event <span className="text-gradient-gold">Gallery</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="text-slate-400 text-lg max-w-xl mx-auto"
                    >
                        Memories, moments, and highlights from our events and workshops.
                    </motion.p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
                {/* Event filter tabs */}
                {!loading && events.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 overflow-x-auto pb-4 mb-10 hide-scrollbar"
                    >
                        <button
                            onClick={() => setSelectedEvent('all')}
                            className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all shrink-0 ${selectedEvent === 'all' ? 'bg-gold/10 text-gold border-gold/40' : 'bg-slate-800/60 text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}`}
                        >
                            All Events
                        </button>
                        {events.map(ev => (
                            <button
                                key={ev._id}
                                onClick={() => setSelectedEvent(ev._id)}
                                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all shrink-0 ${selectedEvent === ev._id ? 'bg-blue-500/10 text-blue-400 border-blue-500/40' : 'bg-slate-800/60 text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}`}
                            >
                                {ev.title}
                            </button>
                        ))}
                    </motion.div>
                )}

                {/* States */}
                {loading && <Skeleton />}

                {!loading && error && (
                    <div className="py-20 text-center space-y-4">
                        <p className="text-red-400 font-bold">{error}</p>
                        <button onClick={fetchGallery} className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/10 transition-all">
                            <FiRefreshCw className="w-4 h-4" /> Retry
                        </button>
                    </div>
                )}

                {!loading && !error && images.length === 0 && (
                    <div className="py-20 text-center space-y-3">
                        <FiImage className="w-16 h-16 text-slate-700 mx-auto" />
                        <p className="text-slate-400 text-lg font-bold">No gallery images yet</p>
                        <p className="text-slate-600 text-sm">Check back soon!</p>
                    </div>
                )}

                {/* Grouped Gallery */}
                {!loading && !error && grouped.map(group => (
                    <motion.section
                        key={group.event._id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        className="mb-16"
                    >
                        {/* Section Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                            <div className="shrink-0">
                                <h2 className="text-xl font-black text-white tracking-tight text-center">{group.event.title}</h2>
                                {group.event.date && (
                                    <p className="text-xs text-slate-500 text-center mt-0.5 font-bold">
                                        {new Date(group.event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                )}
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                        </div>

                        {/* Masonry-style grid */}
                        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                            {group.images.map((img, imgIdx) => (
                                <motion.div
                                    key={img._id}
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: imgIdx * 0.04 }}
                                    className="break-inside-avoid mb-3 group relative cursor-pointer rounded-2xl overflow-hidden"
                                    onClick={() => openLightbox(group.images, imgIdx)}
                                >
                                    <img
                                        src={img.imageUrl}
                                        alt={img.altText || img.title || group.event.title}
                                        className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                                        {img.caption && (
                                            <p className="text-white text-xs font-medium leading-snug">{img.caption}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.section>
                ))}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {lightbox && (
                    <Lightbox
                        images={lightbox.images}
                        initialIndex={lightbox.index}
                        onClose={() => setLightbox(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
