'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiImage, FiX, FiCheck } from 'react-icons/fi';

interface Partner {
    _id: string;
    name: string;
    logoUrl: string;
}

export default function AdminPartners() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const res = await fetch('/api/admin/partners');
            const data = await res.json();
            if (Array.isArray(data)) setPartners(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/partners', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, logoUrl }),
            });

            if (res.ok) {
                fetchPartners();
                setShowModal(false);
                setName('');
                setLogoUrl('');
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
            const res = await fetch(`/api/admin/partners?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchPartners();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Our Partners</h1>
                    <p className="text-gray-400">Manage companies and organizations logos.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-accent hover:bg-accent/80 text-dark font-black px-6 py-3 rounded-xl flex items-center transition-all shadow-lg"
                >
                    <FiPlus className="mr-2" /> Add Partner
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {partners.map((partner) => (
                    <div key={partner._id} className="glass p-6 rounded-2xl border border-white/5 relative group hover:border-accent/50 transition-all flex flex-col items-center">
                        <button
                            onClick={() => handleDelete(partner._id)}
                            className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                            <FiTrash2 size={14} />
                        </button>
                        <div className="aspect-square w-full bg-white/5 rounded-xl flex items-center justify-center p-4 mb-3">
                            <img src={partner.logoUrl} alt={partner.name} className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all" />
                        </div>
                        <p className="text-xs font-bold text-gray-400 text-center truncate w-full">{partner.name}</p>
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
                            className="bg-dark-light w-full max-w-md rounded-3xl p-8 border border-white/10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-white">Add Partner</h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                                    <FiX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-gray-400 text-sm font-bold uppercase tracking-wider">Partner Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-dark/50 border border-white/10 rounded-xl p-4 text-white focus:border-accent outline-none"
                                        placeholder="e.g. Google"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-gray-400 text-sm font-bold uppercase tracking-wider">Logo URL</label>
                                    <div className="relative group">
                                        <FiImage className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            className="w-full bg-dark/50 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-accent outline-none"
                                            placeholder="https://..."
                                            value={logoUrl}
                                            onChange={(e) => setLogoUrl(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-accent hover:bg-accent/80 text-dark font-black py-4 rounded-xl text-lg transition-all"
                                >
                                    {loading ? 'Adding...' : 'ADD PARTNER'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
