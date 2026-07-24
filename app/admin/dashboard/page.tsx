'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBook, FiKey, FiUsers, FiTrendingUp } from 'react-icons/fi';

export default function AdminDashboard() {
    const [counts, setCounts] = useState({ tracks: 0, students: 0, codes: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const [tracksRes, studentsRes, codesRes] = await Promise.all([
                    fetch('/api/tracks'),
                    fetch('/api/admin/students', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/admin/codes', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const [tracks, students, codes] = await Promise.all([
                    tracksRes.json(),
                    studentsRes.json(),
                    codesRes.json()
                ]);

                setCounts({
                    tracks: Array.isArray(tracks) ? tracks.length : 0,
                    students: Array.isArray(students) ? students.length : 0,
                    codes: Array.isArray(codes) ? codes.length : 0
                });
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { title: 'Total Tracks', value: counts.tracks.toString(), icon: FiBook, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { title: 'Registered Users', value: counts.students.toString(), icon: FiUsers, color: 'text-green-500', bg: 'bg-green-500/10' },
        { title: 'Codes Generated', value: counts.codes.toString(), icon: FiKey, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { title: 'Active Students', value: (counts.students - 1 > 0 ? counts.students - 1 : 0).toString(), icon: FiTrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
                <p className="text-gray-400">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass p-6 rounded-2xl flex items-center"
                    >
                        <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} mr-4`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">{stat.title}</p>
                            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                    <p className="text-gray-500 text-center py-12">No recent activity found.</p>
                </div>
                <div className="glass p-8 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
                    <div className="space-y-4">
                        <button className="w-full p-4 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl transition-all text-left flex items-center">
                            <FiBook className="mr-3" /> Add New Track
                        </button>
                        <button className="w-full p-4 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 rounded-xl transition-all text-left flex items-center">
                            <FiKey className="mr-3" /> Generate Access Codes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
