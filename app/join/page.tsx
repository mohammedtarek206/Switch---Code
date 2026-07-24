'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiFileText, FiGrid, FiArrowRight, FiInfo } from 'react-icons/fi';
import Link from 'next/link';

interface Committee {
    _id: string;
    name: string;
    description: string;
    color?: string;
    icon?: string;
}

interface Recruitment {
    _id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    committees: Committee[];
}

export default function JoinCommunityPage() {
    const [cycle, setCycle] = useState<Recruitment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActiveCycle() {
            try {
                const res = await fetch('/api/join');
                if (res.ok) {
                    setCycle(await res.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchActiveCycle();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark text-white flex flex-col justify-between py-16 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-12 w-full">
                {/* Header Intro */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex bg-accent/10 border border-accent/20 px-4 py-2 rounded-full text-xs font-bold text-accent tracking-widest uppercase mb-2"
                    >
                        Switch Code Community
                    </motion.div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
                    >
                        Empower Your Technical <span className="text-accent block sm:inline">Skills & Horizons</span>
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.15 }}
                        className="text-gray-400 text-md max-w-xl mx-auto leading-relaxed"
                    >
                        Apply to join our specialized committees, collaborate on production systems, and earn points and badges.
                    </motion.p>
                </div>

                {/* Campaign Info */}
                {!cycle ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass p-12 text-center rounded-3xl space-y-4"
                    >
                        <FiInfo className="w-12 h-12 mx-auto text-gray-500" />
                        <h3 className="text-xl font-bold">Applications are currently closed</h3>
                        <p className="text-gray-400 text-sm max-w-md mx-auto">
                            Follow our announcements and channels to know when the next session opens.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="space-y-8"
                    >
                        {/* Active recruitment card */}
                        <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl rounded-full"></div>

                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                <div>
                                    <span className="text-xs uppercase font-extrabold tracking-widest text-accent font-bold block mb-1">Active Cycle</span>
                                    <h3 className="text-2xl font-extrabold text-white">{cycle.name}</h3>
                                </div>
                                <div className="flex items-center text-xs text-gray-400 bg-white/5 px-4 py-2 rounded-xl">
                                    <FiClock className="mr-2 text-accent" />
                                    <span>Closing Date: {new Date(cycle.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <p className="text-gray-300 text-sm leading-relaxed mb-6">{cycle.description}</p>
                        </div>

                        {/* Target Committees list */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-white">Select a Committee to Apply</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                {cycle.committees?.map((c) => (
                                    <div
                                        key={c._id}
                                        className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between"
                                        style={{ borderTop: `4px solid ${c.color || '#00A3FF'}` }}
                                    >
                                        <div>
                                            <div className="flex items-center space-x-3 mb-3">
                                                <div className="p-2 bg-white/5 text-xs rounded-lg" style={{ color: c.color }}>
                                                    <FiGrid className="w-5 h-5" />
                                                </div>
                                                <h4 className="font-bold text-white text-lg">{c.name}</h4>
                                            </div>
                                            <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-6">{c.description}</p>
                                        </div>

                                        <Link
                                            href={`/join/apply/${cycle._id}?committeeId=${c._id}`}
                                            className="w-full flex items-center justify-center p-3 bg-accent hover:bg-accent-dark text-black rounded-xl text-xs font-bold transition-all"
                                        >
                                            Apply Now <FiArrowRight className="ml-1.5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
