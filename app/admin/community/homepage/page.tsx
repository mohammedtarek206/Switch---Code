'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiLayout, FiEye, FiEyeOff, FiSave, FiCheck,
    FiArrowUp, FiArrowDown, FiSliders, FiImage, FiGrid
} from 'react-icons/fi';

export default function AdminHomepageControlPage() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    async function fetchConfig() {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/homepage-config', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setConfig(await res.json());
            }
        } catch (err) {
            console.error('Failed to load homepage config', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setSuccessMsg('');
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/admin/homepage-config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setSuccessMsg('Homepage configuration saved successfully!');
                setTimeout(() => setSuccessMsg(''), 4000);
            }
        } catch (err) {
            console.error('Failed to save config', err);
        } finally {
            setSaving(false);
        }
    }

    function toggleSection(sectionKey: string) {
        setConfig((prev: any) => ({
            ...prev,
            sectionsVisibility: {
                ...prev.sectionsVisibility,
                [sectionKey]: !prev.sectionsVisibility[sectionKey]
            }
        }));
    }

    function moveSection(index: number, direction: 'up' | 'down') {
        const order = [...config.sectionOrder];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= order.length) return;
        const temp = order[index];
        order[index] = order[newIndex];
        order[newIndex] = temp;
        setConfig((prev: any) => ({ ...prev, sectionOrder: order }));
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07111F] text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-gold"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#07111F] text-white p-4 md:p-8 space-y-8 pb-24 max-w-6xl mx-auto">
            {/* Header */}
            <div className="glass-panel p-8 rounded-3xl border border-blue-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <span className="text-xs font-extrabold uppercase text-gold bg-gold/10 border border-gold/20 px-3 py-1 rounded-full mb-3 inline-block">
                        CMS Admin Control
                    </span>
                    <h1 className="text-3xl font-extrabold text-white">Dynamic Homepage Manager</h1>
                    <p className="text-gray-400 text-sm mt-1">Control sections visibility, banner text, reorder homepage blocks, and manage highlights dynamically without touching code.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white transition-colors text-black font-extrabold px-6 py-3 rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : <><FiSave /> Save Changes</>}
                </button>
            </div>

            {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
                    <FiCheck className="text-lg" /> {successMsg}
                </div>
            )}

            {/* Hero Banner Section Form */}
            <div className="glass-panel p-8 rounded-3xl border border-blue-500/20 space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiLayout className="text-gold" /> Hero Section Customization
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Main Heading Title</label>
                        <input
                            type="text"
                            value={config?.hero?.title || ''}
                            onChange={(e) => setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })}
                            className="w-full bg-slate-900 border border-blue-500/20 border border-blue-500/30 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Subtitle / Description</label>
                        <input
                            type="text"
                            value={config?.hero?.subtitle || ''}
                            onChange={(e) => setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })}
                            className="w-full bg-slate-900 border border-blue-500/20 border border-blue-500/30 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Primary Button Text</label>
                        <input
                            type="text"
                            value={config?.hero?.ctaPrimaryText || ''}
                            onChange={(e) => setConfig({ ...config, hero: { ...config.hero, ctaPrimaryText: e.target.value } })}
                            className="w-full bg-slate-900 border border-blue-500/20 border border-blue-500/30 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Primary Button Link</label>
                        <input
                            type="text"
                            value={config?.hero?.ctaPrimaryLink || ''}
                            onChange={(e) => setConfig({ ...config, hero: { ...config.hero, ctaPrimaryLink: e.target.value } })}
                            className="w-full bg-slate-900 border border-blue-500/20 border border-blue-500/30 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold"
                        />
                    </div>
                </div>
            </div>

            {/* Sections Visibility & Drag/Reorder */}
            <div className="glass-panel p-8 rounded-3xl border border-blue-500/20 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FiSliders className="text-gold" /> Homepage Sections Reordering & Toggles
                    </h2>
                    <span className="text-xs text-gray-400 font-bold">Use Up/Down arrows to reorder sections</span>
                </div>

                <div className="space-y-3">
                    {config?.sectionOrder?.map((secKey: string, idx: number) => {
                        const isVisible = config?.sectionsVisibility?.[secKey] !== false;
                        return (
                            <div key={secKey} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isVisible ? 'bg-slate-900 border border-blue-500/20 border-blue-500/30' : 'bg-white/[0.01] border-blue-500/20 opacity-50'}`}>
                                <div className="flex items-center gap-4">
                                    <span className="w-8 h-8 rounded-full bg-slate-900 border border-blue-500/20 border border-blue-500/30 flex items-center justify-center font-extrabold text-xs text-gold">
                                        {idx + 1}
                                    </span>
                                    <span className="font-bold text-sm capitalize text-white">
                                        {secKey.replace(/([A-Z])/g, ' $1')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleSection(secKey)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${isVisible ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                            }`}
                                    >
                                        {isVisible ? <><FiEye /> Visible</> : <><FiEyeOff /> Hidden</>}
                                    </button>

                                    <button
                                        disabled={idx === 0}
                                        onClick={() => moveSection(idx, 'up')}
                                        className="p-2 rounded-xl bg-slate-900 border border-blue-500/20 hover:bg-slate-800 border border-blue-500/30 text-gray-400 hover:text-white disabled:opacity-30"
                                    >
                                        <FiArrowUp />
                                    </button>
                                    <button
                                        disabled={idx === config.sectionOrder.length - 1}
                                        onClick={() => moveSection(idx, 'down')}
                                        className="p-2 rounded-xl bg-slate-900 border border-blue-500/20 hover:bg-slate-800 border border-blue-500/30 text-gray-400 hover:text-white disabled:opacity-30"
                                    >
                                        <FiArrowDown />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
