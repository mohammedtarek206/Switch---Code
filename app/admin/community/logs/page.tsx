'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiActivity, FiUser, FiInfo, FiSliders } from 'react-icons/fi';

interface User {
    name: string;
    role: string;
    email: string;
}

interface ActivityLog {
    _id: string;
    userId: User;
    action: string;
    targetModel: string;
    targetId: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export default function ActivityLogsAuditsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    async function fetchLogs() {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/community/activity-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setLogs(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Audit & Activity Log</h1>
                <p className="text-gray-400">Security audit history tracking all administrative modifications & scores.</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            ) : logs.length === 0 ? (
                <div className="glass p-12 text-center rounded-2xl">
                    <FiInfo className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                    <p className="text-gray-400">No activity recorded logs found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((log, idx) => (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="glass p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs"
                        >
                            <div className="flex items-start space-x-3.5">
                                <div className="p-3 bg-accent/10 text-accent rounded-xl mt-0.5">
                                    <FiActivity className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap gap-2 items-center mb-1">
                                        <span className="font-extrabold text-white text-sm uppercase tracking-wider">{log.action.replace(/_/g, ' ')}</span>
                                        <span className="bg-white/5 text-gray-400 px-2 py-0.5 rounded uppercase font-bold text-[9px] tracking-wider">{log.targetModel}</span>
                                    </div>
                                    <p className="text-gray-400 text-xs">
                                        Target Reference: <span className="font-mono text-gray-500">{log.targetId}</span>
                                    </p>
                                    {log.metadata && (
                                        <div className="mt-2 p-3 bg-black/30 rounded-lg text-gray-500 font-mono text-[10px] max-w-lg overflow-x-auto leading-relaxed">
                                            {JSON.stringify(log.metadata)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end text-right md:-mt-1 text-gray-500 gap-1.5 min-w-[200px]">
                                <div className="flex items-center">
                                    <FiUser className="mr-1.5 text-primary" />
                                    <span className="font-bold text-white block capitalize">{log.userId?.name || 'Super Admin'}</span>
                                </div>
                                <div className="flex items-center text-[10px]">
                                    <FiClock className="mr-1.5" />
                                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
