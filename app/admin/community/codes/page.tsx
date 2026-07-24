'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiKey, FiUsers, FiPlus, FiTrash2, FiCopy, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Link from 'next/link';

interface Committee {
    _id: string;
    name: string;
}

interface CommunityCode {
    _id: string;
    code: string;
    role: string;
    committeeId?: { _id: string; name: string };
    committeeName?: string;
    position?: string;
    expirationDate?: string;
    maxUses: number;
    usedCount: number;
    status: string;
    createdAt: string;
}

const ALL_ROLES = [
    'admin', 'super_admin', 'president', 'vice_president',
    'hr', 'pr', 'marketing', 'media', 'technical',
    'committee_leader', 'vice_committee_leader', 'instructor', 'mentor', 'member'
];

export default function AccessCodesPage() {
    const [codes, setCodes] = useState<CommunityCode[]>([]);
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [codeValue, setCodeValue] = useState('');
    const [role, setRole] = useState('member');
    const [committeeId, setCommitteeId] = useState('');
    const [position, setPosition] = useState('');
    const [maxUses, setMaxUses] = useState(1);
    const [expiresAt, setExpiresAt] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const token = localStorage.getItem('token');
            const [codesRes, commRes] = await Promise.all([
                fetch('/api/community/codes', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/community/committees')
            ]);
            if (codesRes.ok) setCodes(await codesRes.json());
            if (commRes.ok) setCommittees(await commRes.json());
        } catch { }
        finally { setLoading(false); }
    }

    function generateRandomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let res = '';
        for (let i = 0; i < 8; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
        setCodeValue(`WC-${res}`);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const token = localStorage.getItem('token');

        // Find committee name if selected
        const selectedComm = committees.find(c => c._id === committeeId);

        const res = await fetch('/api/community/codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                code: codeValue,
                role,
                committeeId: committeeId || undefined,
                committeeName: selectedComm?.name,
                position,
                maxUses,
                expirationDate: expiresAt || undefined
            })
        });

        if (res.ok) {
            setShowModal(false);
            fetchData();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to create code');
        }
    }

    async function handleToggleStatus(id: string, current: string) {
        const token = localStorage.getItem('token');
        await fetch('/api/community/codes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id, status: current === 'active' ? 'inactive' : 'active' })
        });
        fetchData();
    }

    function copyToClipboard(txt: string) {
        navigator.clipboard.writeText(txt);
        alert('Code copied to clipboard!');
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Access Codes</h1>
                    <p className="text-gray-400 text-sm">Generate onboarding invites dictating users' roles and permissions.</p>
                </div>
                <button onClick={() => { generateRandomCode(); setShowModal(true); }}
                    className="flex items-center bg-accent text-black px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-105">
                    <FiPlus className="mr-2" /> Generate Code
                </button>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                {[
                    { icon: FiKey, val: codes.length, label: 'Total Codes' },
                    { icon: FiCheckCircle, val: codes.filter(c => c.status === 'active').length, label: 'Active Codes' },
                    { icon: FiUsers, val: codes.reduce((acc, c) => acc + c.usedCount, 0), label: 'Total Redeemed' },
                ].map((s, i) => (
                    <div key={i} className="glass border border-white/5 p-5 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-xl text-accent"><s.icon className="w-5 h-5" /></div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-gray-500">{s.label}</p>
                            <p className="text-xl font-extrabold text-white">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-white/5 border-b border-white/5 text-[10px] uppercase font-bold text-gray-400">
                            <tr>
                                <th className="p-4">Code</th>
                                <th className="p-4">Role & Position</th>
                                <th className="p-4">Committee</th>
                                <th className="p-4 text-center">Uses</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                            {codes.map(c => (
                                <tr key={c._id} className="hover:bg-white/[0.02]">
                                    <td className="p-4">
                                        <span className="font-mono text-accent bg-accent/10 px-2 py-1 rounded-md cursor-pointer inline-flex items-center gap-2" onClick={() => copyToClipboard(c.code)}>
                                            {c.code} <FiCopy className="w-3 h-3" />
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs">
                                        <span className="block font-bold text-white uppercase">{c.role}</span>
                                        {c.position && <span className="text-gray-500">{c.position}</span>}
                                    </td>
                                    <td className="p-4 text-xs font-semibold text-gray-400">{c.committeeId?.name || c.committeeName || '—'}</td>
                                    <td className="p-4 text-center">
                                        <span className="font-mono text-white">{c.usedCount}</span> / <span className="text-gray-500">{c.maxUses}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleToggleStatus(c._id, c.status)}
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase cursor-pointer ${c.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                            {c.status}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="p-1.5 hover:bg-white/5 rounded text-gray-400"><FiTrash2 /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass w-full max-w-lg rounded-3xl p-8 space-y-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Create Access Code</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-400">Invite Code</label>
                                <div className="flex gap-2">
                                    <input type="text" value={codeValue} onChange={(e) => setCodeValue(e.target.value.toUpperCase())} required
                                        className="flex-1 p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent font-mono uppercase" />
                                    <button type="button" onClick={generateRandomCode} className="px-4 bg-white/5 rounded-xl hover:bg-white/10 text-xs font-bold text-white">Generate</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">System Role</label>
                                    <select value={role} onChange={(e) => setRole(e.target.value)} required
                                        className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent">
                                        {ALL_ROLES.map(r => <option key={r} value={r}>{r.toUpperCase().replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Committee (Optional)</label>
                                    <select value={committeeId} onChange={(e) => setCommitteeId(e.target.value)}
                                        className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent">
                                        <option value="">None / Global</option>
                                        {committees.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Position Title (Optional)</label>
                                    <input type="text" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. HR Member"
                                        className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-400">Maximum Uses</label>
                                    <input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value))} required
                                        className="w-full p-3 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-white/5 rounded-xl font-semibold text-gray-300">Cancel</button>
                                <button type="submit" className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-black rounded-xl font-bold">Create Code</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
