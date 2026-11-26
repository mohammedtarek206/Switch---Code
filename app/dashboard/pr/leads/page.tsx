'use client';

import { useEffect, useState } from 'react';
import { FiBriefcase, FiPlus, FiCheckCircle } from 'react-icons/fi';
import DashboardShell from '@/components/DashboardShell';

interface LeadItem {
    _id: string;
    organizationName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    type: string;
    status: string;
    notes?: string;
    meetings?: { date: string; summary: string }[];
}

export default function PRLeadsPage() {
    const [leads, setLeads] = useState<LeadItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [form, setForm] = useState({
        organizationName: '',
        contactPerson: '',
        email: '',
        phone: '',
        type: 'company',
        notes: '',
    });

    async function loadLeads() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/pr/leads', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setLeads(data.leads || []);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadLeads();
    }, []);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/pr/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(form),
        });
        if (res.ok) {
            setMsg('تمت إضافة جهة التواصل بنجاح.');
            setForm({ organizationName: '', contactPerson: '', email: '', phone: '', type: 'company', notes: '' });
            await loadLeads();
        }
    }

    async function updateStatus(leadId: string, status: string) {
        const token = localStorage.getItem('token');
        if (!token) return;
        await fetch('/api/pr/leads', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ leadId, status }),
        });
        await loadLeads();
    }

    return (
        <DashboardShell title="PR & Partnerships CRM">
            <div className="space-y-6">
                {msg && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                        <FiCheckCircle /> {msg}
                    </div>
                )}

                <form onSubmit={handleCreate} className="glass-panel rounded-2xl p-5 border border-blue-500/20 space-y-4">
                    <h2 className="font-bold text-white text-sm flex items-center gap-2">
                        <FiPlus className="text-gold" /> تسجيل جهة تواصل / شريك محتمل
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                            type="text"
                            required
                            placeholder="اسم الشركة / الجامعة / المجتمع"
                            value={form.organizationName}
                            onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                        />
                        <input
                            type="text"
                            placeholder="الشخص المسؤول"
                            value={form.contactPerson}
                            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                        />
                        <select
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                        >
                            <option value="company">Company</option>
                            <option value="university">University</option>
                            <option value="community">Community</option>
                            <option value="sponsor">Sponsor</option>
                            <option value="media">Media</option>
                        </select>
                        <input
                            type="email"
                            placeholder="Email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                        />
                        <input
                            type="tel"
                            placeholder="Phone"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                        />
                        <input
                            type="text"
                            placeholder="ملاحظات داخلية"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                        />
                    </div>
                    <button type="submit" className="btn-primary-blue px-5 py-2 text-xs">
                        حفظ جهة التواصل
                    </button>
                </form>

                <div className="space-y-3">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <FiBriefcase className="text-blue-400" /> Partner Leads ({leads.length})
                    </h3>
                    {loading ? (
                        <p className="text-xs text-slate-400">جاري التحميل...</p>
                    ) : (
                        leads.map((l) => (
                            <div key={l._id} className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="font-bold text-white text-sm">
                                        {l.organizationName} <span className="text-xs text-gold">({l.type})</span>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {l.contactPerson || '-'} • {l.email || '-'} • {l.phone || '-'}
                                    </div>
                                    {l.notes && <p className="text-xs text-slate-300 mt-1">{l.notes}</p>}
                                </div>
                                <select
                                    value={l.status}
                                    onChange={(e) => updateStatus(l._id, e.target.value)}
                                    className="px-3 py-1.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                >
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="meeting_scheduled">Meeting Scheduled</option>
                                    <option value="negotiating">Negotiating</option>
                                    <option value="partnered">Partnered</option>
                                    <option value="declined">Declined</option>
                                </select>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
