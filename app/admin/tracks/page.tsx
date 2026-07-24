'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiVideo, FiEdit, FiSave, FiX, FiCheckCircle } from 'react-icons/fi';

interface Lesson {
    title: string;
    description: string;
    videoUrl: string;
}

interface Track {
    _id?: string;
    title: string;
    description: string;
    icon: string;
    level: string;
    duration: string;
    price: number;
    lessons: Lesson[];
}

export default function AdminTracks() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingTrack, setEditingTrack] = useState<Track | null>(null);

    // Form State
    const [formData, setFormData] = useState<Track>({
        title: '',
        description: '',
        icon: 'FiCode',
        level: 'Beginner',
        duration: '',
        price: 0,
        lessons: []
    });

    useEffect(() => {
        fetchTracks();
    }, []);

    const fetchTracks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/tracks', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setTracks(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddLesson = () => {
        setFormData({
            ...formData,
            lessons: [...formData.lessons, { title: '', description: '', videoUrl: '' }]
        });
    };

    const updateLesson = (index: number, field: keyof Lesson, value: string) => {
        const updatedLessons = [...formData.lessons];
        updatedLessons[index] = { ...updatedLessons[index], [field]: value };
        setFormData({ ...formData, lessons: updatedLessons });
    };

    const removeLesson = (index: number) => {
        const updatedLessons = formData.lessons.filter((_, i) => i !== index);
        setFormData({ ...formData, lessons: updatedLessons });
    };

    const handleDeleteTrack = async (id: string) => {
        if (!confirm('Are you sure you want to delete this track?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/tracks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchTracks();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEditTrack = (track: Track) => {
        setEditingTrack(track);
        setFormData(track);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const url = editingTrack ? `/api/tracks/${editingTrack._id}` : '/api/tracks';
            const method = editingTrack ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchTracks();
                setShowModal(false);
                setEditingTrack(null);
                setFormData({
                    title: '',
                    description: '',
                    icon: 'FiCode',
                    level: 'Beginner',
                    duration: '',
                    price: 0,
                    lessons: []
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Manage Tracks</h1>
                    <p className="text-gray-400">Add, edit, or remove learning tracks.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTrack(null);
                        setFormData({
                            title: '',
                            description: '',
                            icon: 'FiCode',
                            level: 'Beginner',
                            duration: '',
                            price: 0,
                            lessons: []
                        });
                        setShowModal(true);
                    }}
                    className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-xl flex items-center transition-all shadow-lg shadow-primary/20"
                >
                    <FiPlus className="mr-2" /> Add New Track
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {tracks.map((track) => (
                    <div key={track._id} className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-primary/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-white">{track.title}</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleEditTrack(track)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                                >
                                    <FiEdit />
                                </button>
                                <button
                                    onClick={() => track._id && handleDeleteTrack(track._id)}
                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-all"
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-400 mb-4 line-clamp-2 text-sm">{track.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full font-bold">{track.level}</span>
                            <span className="px-3 py-1 bg-white/5 text-gray-300 rounded-full font-bold">{track.duration}</span>
                            <span className="px-3 py-1 bg-accent/20 text-accent rounded-full font-bold">{track.lessons.length} Lessons</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-dark-light w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 border border-white/10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-white">Add New Training Track</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                                    <FiX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-gray-400 block">Track Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-dark/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                            placeholder="e.g. Python Fundmentals"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-gray-400 block">Duration</label>
                                        <input
                                            type="text"
                                            className="w-full bg-dark/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none"
                                            placeholder="e.g. 4 Weeks"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-gray-400 block">Description</label>
                                    <textarea
                                        className="w-full bg-dark/50 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none h-32 resize-none"
                                        placeholder="Describe what students will learn..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-white flex items-center">
                                            <FiVideo className="mr-2 text-accent" /> Track Content (Lessons)
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={handleAddLesson}
                                            className="text-accent hover:text-accent/80 flex items-center text-sm font-bold"
                                        >
                                            <FiPlus className="mr-1" /> ADD LESSON
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.lessons.map((lesson, index) => (
                                            <div key={index} className="bg-dark/40 border border-white/5 p-6 rounded-2xl space-y-4 relative">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLesson(index)}
                                                    className="absolute right-4 top-4 text-red-500 hover:text-red-400"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Lesson Title"
                                                        className="bg-dark/60 border border-white/10 rounded-lg p-2 text-white outline-none"
                                                        value={lesson.title}
                                                        onChange={(e) => updateLesson(index, 'title', e.target.value)}
                                                        required
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Dailymotion Video URL or ID"
                                                        className="bg-dark/60 border border-white/10 rounded-lg p-2 text-white outline-none"
                                                        value={lesson.videoUrl}
                                                        onChange={(e) => updateLesson(index, 'videoUrl', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <textarea
                                                    placeholder="Short lesson description"
                                                    className="w-full bg-dark/60 border border-white/10 rounded-lg p-2 text-white outline-none h-20 resize-none"
                                                    value={lesson.description}
                                                    onChange={(e) => updateLesson(index, 'description', e.target.value)}
                                                />
                                            </div>
                                        ))}
                                        {formData.lessons.length === 0 && (
                                            <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-2xl text-gray-500">
                                                No lessons added yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-primary to-accent py-4 rounded-xl text-white font-bold text-lg"
                                >
                                    {loading ? 'Creating...' : 'SAVE TRACK'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
