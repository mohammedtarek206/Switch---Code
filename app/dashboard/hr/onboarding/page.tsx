'use client';

import { useEffect, useState } from 'react';
import { FiUsers, FiSend, FiCheckCircle, FiUserCheck } from 'react-icons/fi';
import DashboardShell from '@/components/DashboardShell';

interface MemberRow {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    committeeId?: { name: string };
    createdAt?: string;
}

export default function HROnboardingPage() {
    const [loading, setLoading] = useState(true);
    const [newMembers, setNewMembers] = useState<MemberRow[]>([]);
    const [stats, setStats] = useState({ newMembersCount: 0, totalActiveMembers: 0, activeTasks: 0 });
    const [messageText, setMessageText] = useState<Record<string, string>>({});
    const [msg, setMsg] = useState('');

    async function loadData() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/hr/onboarding', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNewMembers(data.newMembers || []);
                setStats(data.stats || { newMembersCount: 0, totalActiveMembers: 0, activeTasks: 0 });
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function sendFollowUp(userId: string) {
        const token = localStorage.getItem('token');
        const text = messageText[userId]?.trim() || 'مرحباً بك في Switch Code! هل تحتاج أي مساعدة للبدء في لجنتك؟';
        if (!token) return;
        const res = await fetch('/api/hr/onboarding', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId, message: text }),
        });
        if (res.ok) {
            setMsg('تم إرسال رسالة المتابعة للأعضاء بنجاح.');
            setMessageText((p) => ({ ...p, [userId]: '' }));
        }
    }

    return (
        <DashboardShell title="HR Onboarding & Member Follow-up">
            {loading ? (
                <div className="text-center py-20 text-slate-400">جاري تحميل بيانات الأعضاء...</div>
            ) : (
                <div className="space-y-6">
                    {msg && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                            <FiCheckCircle /> {msg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-xs text-slate-400">أعضاء جدد (آخر 14 يوم)</div>
                            <div className="text-2xl font-black text-gold mt-1">{stats.newMembersCount}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-xs text-slate-400">إجمالي أعضاء اللجان النشطين</div>
                            <div className="text-2xl font-black text-blue-400 mt-1">{stats.totalActiveMembers}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-xs text-slate-400">المهام النشطة بالمجتمع</div>
                            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.activeTasks}</div>
                        </div>
                    </div>

                    <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
                        <h2 className="font-bold text-white text-sm flex items-center gap-2">
                            <FiUserCheck className="text-blue-400" /> متابعة الأعضاء الجدد (Onboarding)
                        </h2>
                        {newMembers.length === 0 ? (
                            <p className="text-xs text-slate-400">لا يوجد أعضاء جدد خلال آخر 14 يوماً.</p>
                        ) : (
                            <div className="space-y-3">
                                {newMembers.map((m) => (
                                    <div key={m._id} className="p-4 rounded-xl bg-[#0B1220] border border-white/10 space-y-2">
                                        <div className="flex flex-wrap justify-between gap-2">
                                            <div>
                                                <div className="font-bold text-white text-sm flex items-center gap-2">
                                                    <FiUsers className="text-gold" /> {m.name}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {m.email} • {m.phone || '-'} • {m.committeeId?.name || 'No Committee'}
                                                </div>
                                            </div>
                                            <span className="text-[11px] text-slate-500">
                                                {m.createdAt ? new Date(m.createdAt).toLocaleDateString('ar-EG') : ''}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="رسالة ترحيب أو متابعة Onboarding..."
                                                value={messageText[m._id] || ''}
                                                onChange={(e) => setMessageText((p) => ({ ...p, [m._id]: e.target.value }))}
                                                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => sendFollowUp(m._id)}
                                                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                                            >
                                                <FiSend /> إرسال متابعة
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardShell>
    );
}
