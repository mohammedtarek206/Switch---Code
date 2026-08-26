'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiFileText, FiDownload, FiExternalLink, FiCheckCircle,
    FiAlertCircle, FiRefreshCw, FiArrowLeft, FiTarget,
    FiFilePlus, FiLink, FiBook, FiMonitor
} from 'react-icons/fi';
import Link from 'next/link';

interface Material {
    _id: string;
    title: string;
    description: string;
    materialType: 'pdf' | 'document' | 'presentation' | 'link' | 'other';
    fileUrl: string;
    order: number;
    allowDownload: boolean;
    progress?: { completed: boolean; openedAt: string } | null;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    pdf: { icon: FiFilePlus, color: 'text-red-400', bg: 'bg-red-500/10', label: 'PDF' },
    document: { icon: FiBook, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Document' },
    presentation: { icon: FiMonitor, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Presentation' },
    link: { icon: FiLink, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Link' },
    other: { icon: FiFileText, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'File' },
};

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [noTrack, setNoTrack] = useState(false);

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/lms/materials', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });

            if (res.status === 401) { window.location.href = '/login'; return; }
            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            if (data.noTrack) { setNoTrack(true); return; }
            setMaterials(data.materials || []);
        } catch {
            setError('حدث خطأ أثناء تحميل المواد');
        } finally {
            setLoading(false);
        }
    };

    const openMaterial = async (material: Material) => {
        // Mark as viewed
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/lms/materials/progress', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ materialId: material._id }),
            });
            // Update local progress
            setMaterials(prev => prev.map(m =>
                m._id === material._id
                    ? { ...m, progress: { completed: true, openedAt: new Date().toISOString() } }
                    : m
            ));
        } catch { }

        // Open the file
        window.open(material.fileUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
                    <p className="text-gray-400 font-medium">Loading Materials...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <FiAlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <p className="text-gray-300">{error}</p>
                    <button onClick={fetchMaterials} className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-500/20 transition-all">
                        <FiRefreshCw className="w-4 h-4" /> Retry
                    </button>
                </div>
            </div>
        );
    }

    if (noTrack) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-md">
                    <FiTarget className="w-16 h-16 text-gray-600 mx-auto" />
                    <h2 className="text-xl font-bold text-white">No Track Selected</h2>
                    <p className="text-gray-400">Please select a track to access reading materials.</p>
                    <Link href="/learn" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-500/20 transition-all">
                        <FiTarget className="w-4 h-4" /> Choose Track
                    </Link>
                </div>
            </div>
        );
    }

    const completedCount = materials.filter(m => m.progress?.completed).length;

    return (
        <div className="min-h-screen bg-[#07111F] text-white py-10 px-4 md:px-8">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link href="/learn" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3 transition-colors">
                            <FiArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3">
                            <FiFileText className="text-blue-400" /> Reading Materials
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">{completedCount} / {materials.length} materials opened</p>
                    </div>
                </div>

                {/* Progress Bar */}
                {materials.length > 0 && (
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${materials.length > 0 ? Math.round((completedCount / materials.length) * 100) : 0}%` }}
                            transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                        />
                    </div>
                )}

                {/* Empty state */}
                {materials.length === 0 && (
                    <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
                        <FiFileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">No Materials Available</h2>
                        <p className="text-gray-400">No reading materials available for your track yet.</p>
                    </div>
                )}

                {/* Materials List */}
                {materials.length > 0 && (
                    <div className="space-y-4">
                        {materials.map((material, idx) => {
                            const config = typeConfig[material.materialType] || typeConfig.other;
                            return (
                                <motion.div
                                    key={material._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`group bg-white/[0.02] rounded-2xl border p-5 transition-all ${material.progress?.completed ? 'border-green-500/20' : 'border-white/5'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 ${config.bg} rounded-xl shrink-0`}>
                                            <config.icon className={`w-6 h-6 ${config.color}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-bold text-white text-base leading-snug">{material.title}</h3>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {material.progress?.completed && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                                                            <FiCheckCircle className="w-3 h-3" /> Viewed
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 ${config.bg} ${config.color} rounded-full`}>
                                                        {config.label}
                                                    </span>
                                                </div>
                                            </div>
                                            {material.description && (
                                                <p className="text-gray-400 text-sm line-clamp-2 mb-3">{material.description}</p>
                                            )}

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => openMaterial(material)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${config.bg} ${config.color} border border-current border-opacity-30 hover:opacity-80`}
                                                >
                                                    <FiExternalLink className="w-3.5 h-3.5" />
                                                    {material.materialType === 'link' ? 'Open Link' : 'View File'}
                                                </button>

                                                {material.allowDownload && material.materialType !== 'link' && (
                                                    <a
                                                        href={material.fileUrl}
                                                        download
                                                        onClick={() => openMaterial(material)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-400 border border-white/10 rounded-xl font-bold text-xs hover:bg-white/10 transition-all"
                                                    >
                                                        <FiDownload className="w-3.5 h-3.5" /> Download
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
}
