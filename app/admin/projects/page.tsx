'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiImage, FiX, FiExternalLink, FiUser } from 'react-icons/fi';

interface Project {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    studentName: string;
    demoUrl?: string;
}

export default function AdminProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        studentName: '',
        demoUrl: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/admin/projects');
            const data = await res.json();
            if (Array.isArray(data)) setProjects(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                fetchProjects();
                setShowModal(false);
                setFormData({ title: '', description: '', imageUrl: '', studentName: '', demoUrl: '' });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/projects?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchProjects();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Student Projects</h1>
                    <p className="text-gray-400">Showcase best work from your students.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/80 text-white font-black px-6 py-3 rounded-xl flex items-center transition-all shadow-lg"
                >
                    <FiPlus className="mr-2" /> Add Project
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                    <div key={project._id} className="glass rounded-[2rem] border border-white/5 overflow-hidden group hover:border-primary/50 transition-all flex flex-col">
                        <div className="relative aspect-video">
                            <img src={project.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={project.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <button
                                onClick={() => handleDelete(project._id)}
                                className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                        <div className="p-8 space-y-4 flex-1">
                            <div className="flex items-center text-xs text-primary font-black uppercase tracking-widest">
                                <FiUser className="mr-2" /> {project.studentName}
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight">{project.title}</h3>
                            <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">{project.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-dark-light w-full max-w-2xl rounded-[2.5rem] p-10 border border-white/10"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-3xl font-black text-white tracking-tighter">Add Student Work</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors p-2 bg-white/5 rounded-full">
                                    <FiX size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Project Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                            placeholder="e.g. E-Commerce Dashboard"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Student Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                            placeholder="e.g. Ahmed Ali"
                                            value={formData.studentName}
                                            onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Image URL</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none"
                                        placeholder="https://..."
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-primary/50 outline-none h-32 resize-none"
                                        placeholder="Explain what makes this project special..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-primary hover:shadow-2xl hover:shadow-primary/20 text-white font-black py-5 rounded-2xl text-lg transition-all"
                                >
                                    {loading ? 'Publishing...' : 'PUBLISH PROJECT'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
