'use client';

import { useEffect, useState } from 'react';
import {
    FiCheckCircle, FiXCircle, FiEdit3, FiExternalLink, FiClock,
    FiRefreshCw, FiFileText
} from 'react-icons/fi';

interface MaterialItem {
    _id: string;
    title: string;
    description?: string;
    lectureTitle?: string;
    materialType: string;
    fileUrl: string;
    notes?: string;
    approvalStatus: string;
    reviewFeedback?: string;
    createdAt: string;
    versions?: Array<{ version: number }>;
    trackId?: { name: string };
    createdBy?: { name: string; email: string };
    reviewedBy?: { name: string };
}

const STATUS_BADGES: Record<string, string> = {
    pending_review: 'bg-amber-500/20 text-gold',
    pending_approval: 'bg-amber-500/20 text-gold',
    approved: 'bg-emerald-500/20 text-emerald-300',
    rejected: 'bg-red-500/20 text-red-400',
    changes_requested: 'bg-orange-500/20 text-orange-300',
};

export default function AdminMaterialApprovalsPage() {
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending_review');
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    async function loadMaterials(filter = statusFilter) {
        const token = localStorage.getItem('token');
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/materials/review?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMaterials(data.materials || []);
                setPendingCount(data.pendingCount || 0);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMaterials(statusFilter);
    }, [statusFilter]);

    async function handleDecision(
        materialId: string,
        decision: 'approve' | 'reject' | 'request_changes' | 'revoke'
    ) {
        setMsg('');
        setError('');
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch('/api/admin/materials/review', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                materialId,
                decision,
                feedback: feedbackMap[materialId] || '',
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'فشل تنفيذ القرار.');
            return;
        }
        setMsg(data.message || 'تم حفظ القرار.');
        await loadMaterials(statusFilter);
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <FiFileText className="text-gold" /> Material Approval Center
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        مراجعة واعتماد المواد التعليمية المرفوعة من المحاضرين قبل إتاحتها للطلاب ({pendingCount} بانتظار المراجعة)
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => loadMaterials(statusFilter)}
                    className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold inline-flex items-center gap-1.5"
                >
                    <FiRefreshCw /> تحديث
                </button>
            </div>

            {msg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                    {msg}
                </div>
            )}
            {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {error}
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {[
                    { id: 'pending_review', label: `Pending Review (${pendingCount})` },
                    { id: 'changes_requested', label: 'Changes Requested' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'rejected', label: 'Rejected' },
                    { id: 'all', label: 'All Materials' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStatusFilter(tab.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold ${
                            statusFilter === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#0B1220] text-slate-300 border border-white/10'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-slate-400 text-sm py-12 text-center">جاري تحميل المواد...</div>
            ) : materials.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-sm">
                    لا توجد مواد في هذا القسم حالياً.
                </div>
            ) : (
                <div className="space-y-4">
                    {materials.map((m) => (
                        <div key={m._id} className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-extrabold text-white text-base">{m.title}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_BADGES[m.approvalStatus] || 'bg-slate-500/20 text-slate-300'}`}>
                                            {m.approvalStatus}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[11px] uppercase">
                                            {m.materialType}
                                        </span>
                                        {m.versions && m.versions.length > 1 && (
                                            <span className="text-[11px] text-purple-300">v{m.versions.length}</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        المسار: <strong className="text-gold">{m.trackId?.name || '-'}</strong>
                                        {m.lectureTitle ? ` • المحاضرة: ${m.lectureTitle}` : ''}
                                        {' • '}المحاضر: {m.createdBy?.name || 'Admin'} ({m.createdBy?.email || ''})
                                    </div>
                                    {m.description && <p className="text-xs text-slate-300 mt-2">{m.description}</p>}
                                    {m.notes && <p className="text-[11px] text-slate-400 mt-1">ملاحظات المحاضر: {m.notes}</p>}
                                </div>

                                <a
                                    href={m.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 rounded-xl bg-slate-900 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                                >
                                    <FiExternalLink /> معاينة الملف
                                </a>
                            </div>

                            {m.reviewFeedback && (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                                    <strong>آخر مراجعة ({m.reviewedBy?.name || 'Admin'}):</strong> {m.reviewFeedback}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/10">
                                <input
                                    type="text"
                                    placeholder="ملاحظات المراجعة / سبب الرفض أو التعديل (إلزامي عند الرفض أو طلب التعديل)..."
                                    value={feedbackMap[m._id] || ''}
                                    onChange={(e) => setFeedbackMap((p) => ({ ...p, [m._id]: e.target.value }))}
                                    className="flex-1 px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                />
                                {m.approvalStatus !== 'approved' ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleDecision(m._id, 'approve')}
                                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1"
                                        >
                                            <FiCheckCircle /> اعتماد ونشر
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDecision(m._id, 'request_changes')}
                                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold inline-flex items-center gap-1"
                                        >
                                            <FiEdit3 /> طلب تعديل
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDecision(m._id, 'reject')}
                                            className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold inline-flex items-center gap-1"
                                        >
                                            <FiXCircle /> رفض
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleDecision(m._id, 'revoke')}
                                        className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold inline-flex items-center gap-1"
                                    >
                                        <FiClock /> سحب الاعتماد
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
