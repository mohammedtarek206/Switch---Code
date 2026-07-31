'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiUsers, FiTarget, FiBarChart2, FiCalendar, FiEye } from 'react-icons/fi';
import Link from 'next/link';

export default function MarketingDashboard() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (!['marketing', 'pr', 'admin', 'super_admin', 'committee_leader', 'vice_committee_leader'].includes(user.role)) {
                window.location.href = '/dashboard';
            }
        }
        fetchCampaignData();
    }, []);

    async function fetchCampaignData() {
        const token = localStorage.getItem('token');
        const timeoutId = setTimeout(() => setLoading(false), 1500);
        try {
            // Events serve as marketing campaigns — fetch real events from DB
            const res = await fetch('/api/community/events', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const eventsArr = Array.isArray(data) ? data : data.events || [];
                setEvents(eventsArr);
            }
        } catch (err) {
            console.error('Failed to fetch events for marketing dashboard', err);
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    }

    const now = new Date();
    const activeEvents = events.filter(e => new Date(e.date) >= now);
    const pastEvents = events.filter(e => new Date(e.date) < now);
    const totalRegistrations = events.reduce((sum, e) => sum + (e.registrationsCount || e.seats || 0), 0);
    const totalSeats = events.reduce((sum, e) => sum + (e.seats || 50), 0);
    const conversionRate = totalSeats > 0 ? Math.round((totalRegistrations / totalSeats) * 100) : 0;

    const STATUS_BADGE: Record<string, string> = {
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        upcoming: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        ended: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };

    function getEventStatus(ev: any) {
        const evDate = new Date(ev.date);
        if (evDate > now) return 'upcoming';
        return 'ended';
    }

    return (
        <div className="min-h-screen bg-[#07111F] text-white py-10 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="inline-flex items-center bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-bold text-orange-400 mb-2">
                            Marketing Dashboard
                        </div>
                        <h1 className="text-3xl font-extrabold">Campaigns & Reach Center</h1>
                        <p className="text-gray-400 text-sm mt-1">Track events, registrations, and outreach metrics — all real-time from the database.</p>
                    </div>
                    <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white">← Main Dashboard</Link>
                </div>

                {/* Metrics Overview — fully dynamic */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="glass-panel p-5 rounded-2xl border border-blue-500/20 animate-pulse">
                                <div className="h-3 w-20 bg-slate-800 rounded mb-2" />
                                <div className="h-7 w-12 bg-slate-800 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Events', val: events.length.toString(), icon: FiCalendar, color: 'text-orange-400' },
                            { label: 'Upcoming Events', val: activeEvents.length.toString(), icon: FiTrendingUp, color: 'text-gold' },
                            { label: 'Past Events', val: pastEvents.length.toString(), icon: FiTarget, color: 'text-green-400' },
                            { label: 'Total Seats', val: totalSeats.toLocaleString(), icon: FiUsers, color: 'text-blue-400' },
                        ].map((s, i) => (
                            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                className="glass-panel p-5 rounded-2xl border border-blue-500/20 flex items-center gap-3">
                                <div className={`p-3 bg-slate-900 border border-blue-500/20 rounded-xl ${s.color}`}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold block">{s.label}</span>
                                    <span className={`text-xl font-extrabold ${s.color}`}>{s.val}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Events Table — real data acting as campaigns */}
                <div className="glass-panel rounded-3xl border border-blue-500/20 overflow-hidden">
                    <div className="p-6 border-b border-blue-500/20 flex justify-between items-center">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <FiTarget className="text-orange-400" /> Events as Campaigns
                        </h3>
                        <Link href="/admin/community/events" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white transition-colors px-4 py-2.5 rounded-xl text-sm font-bold">
                            Manage Events
                        </Link>
                    </div>

                    {loading ? (
                        <div className="p-5 space-y-3 animate-pulse">
                            {[1, 2, 3].map(n => <div key={n} className="h-12 bg-slate-900 rounded-xl" />)}
                        </div>
                    ) : events.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-sm">
                            No events found. Create events from the admin panel to see them here as campaigns.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="border-b border-blue-500/20">
                                    <tr className="text-gray-400 text-[10px] font-bold uppercase">
                                        <th className="p-4">Event / Campaign</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Seats Available</th>
                                        <th className="p-4">Registration Open</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Location</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {events.map((ev: any, i: number) => {
                                        const status = getEventStatus(ev);
                                        return (
                                            <motion.tr key={ev._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                                className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4 text-white font-bold">{ev.title}</td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${STATUS_BADGE[status]}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-300">{ev.seats || '—'}</td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ev.registrationOpen ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                        {ev.registrationOpen ? 'Open' : 'Closed'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 text-xs">{ev.date ? new Date(ev.date).toLocaleDateString() : '—'}</td>
                                                <td className="p-4 text-gray-400 text-xs">{ev.location || 'Online'}</td>
                                                <td className="p-4 text-right">
                                                    <Link href={`/admin/community/events/${ev._id}`}
                                                        className="p-2 bg-slate-900 border border-blue-500/20 hover:bg-slate-800 rounded-lg text-gray-400 inline-flex" title="View Details">
                                                        <FiEye className="w-4 h-4" />
                                                    </Link>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
