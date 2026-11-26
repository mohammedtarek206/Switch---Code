'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FiBookOpen, FiYoutube, FiFileText, FiCheckSquare, FiPlus,
    FiCheckCircle, FiUser, FiTrendingUp
} from 'react-icons/fi';
import DashboardShell from '@/components/DashboardShell';

interface TrackDetail {
    track: {
        _id: string;
        name: string;
        description: string;
        category: string;
        level: string;
        duration?: string;
    };
    status: string;
    progress: number;
    instructors: { name: string; avatar?: string }[];
    videos: { _id: string; title: string; duration?: string; watched: boolean }[];
    materials: { _id: string; title: string; materialType: string; fileUrl: string }[];
    assignments: { _id: string; title: string; deadline?: string }[];
}

interface AvailableTrack {
    _id: string;
    name: string;
    description: string;
    category: string;
    level: string;
    duration?: string;
}

export default function StudentTracksPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [enrolledTracks, setEnrolledTracks] = useState<TrackDetail[]>([]);
    const [availableTracks, setAvailableTracks] = useState<AvailableTrack[]>([]);
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const [msg, setMsg] = useState('');

    async function loadData() {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            const res = await fetch('/api/student/tracks', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            const data = await res.json();
            const enrolled = data.enrolledTracks || [];
            setEnrolledTracks(enrolled);
            setAvailableTracks(data.availableTracks || []);
            if (enrolled.length > 0 && !selectedTrackId) {
                setSelectedTrackId(enrolled[0].track._id);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function handleEnroll(trackId: string) {
        const token = localStorage.getItem('token');
        if (!token) return;
        setEnrollingId(trackId);
        setMsg('');
        try {
            const res = await fetch('/api/student/tracks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ trackId }),
            });
            const data = await res.json();
            if (res.ok) {
                setMsg(data.message || 'تم الانضمام بنجاح');
                setSelectedTrackId(trackId);
                await loadData();
            }
        } finally {
            setEnrollingId(null);
        }
    }

    const enrolledIds = new Set(enrolledTracks.map((t) => t.track._id));
    const activeDetail = enrolledTracks.find((t) => t.track._id === selectedTrackId) || enrolledTracks[0];

    return (
        <DashboardShell title="My Tracks – المسارات التعليمية">
            {loading ? (
                <div className="text-center py-20 text-slate-400">جاري تحميل المسارات...</div>
            ) : (
                <div className="space-y-8">
                    {msg && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                            {msg}
                        </div>
                    )}

                    {/* Enrolled Tracks Selector */}
                    {enrolledTracks.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-3">
                                {enrolledTracks.map((item) => {
                                    const active = activeDetail?.track._id === item.track._id;
                                    return (
                                        <button
                                            key={item.track._id}
                                            type="button"
                                            onClick={() => setSelectedTrackId(item.track._id)}
                                            className={`px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all flex items-center gap-2 ${
                                                active
                                                    ? 'bg-blue-600 border-blue-400 text-white'
                                                    : 'bg-[#0B1220] border-white/10 text-slate-300 hover:border-blue-500/40'
                                            }`}
                                        >
                                            <FiBookOpen />
                                            <span>{item.track.name}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-black/30">
                                                {item.progress}%
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {activeDetail && (
                                <div className="glass-panel rounded-3xl p-6 border border-blue-500/20 space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                                        <div>
                                            <span className="text-xs font-bold text-gold uppercase">
                                                {activeDetail.track.category} • {activeDetail.track.level}
                                            </span>
                                            <h2 className="text-2xl font-extrabold text-white mt-1">
                                                {activeDetail.track.name}
                                            </h2>
                                            <p className="text-sm text-slate-300 mt-2">{activeDetail.track.description}</p>
                                            {activeDetail.instructors.length > 0 && (
                                                <div className="flex items-center gap-2 mt-3 text-xs text-blue-300">
                                                    <FiUser />
                                                    <span>
                                                        المحاضرون:{' '}
                                                        {activeDetail.instructors.map((i) => i.name).join('، ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-[#0B1220] rounded-2xl p-4 border border-white/10 min-w-[160px] text-center">
                                            <FiTrendingUp className="w-5 h-5 text-gold mx-auto mb-1" />
                                            <div className="text-2xl font-black text-white">{activeDetail.progress}%</div>
                                            <div className="text-[11px] text-slate-400">نسبة الإنجاز</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Videos */}
                                        <div className="bg-[#0B1220]/80 rounded-2xl p-4 border border-white/10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                                    <FiYoutube className="text-red-400" /> الفيديوهات ({activeDetail.videos.length})
                                                </h3>
                                                <Link href="/learn/videos" className="text-xs text-blue-400 hover:underline">
                                                    فتح المشغل
                                                </Link>
                                            </div>
                                            {activeDetail.videos.length === 0 ? (
                                                <p className="text-xs text-slate-500">لا توجد فيديوهات منشورة حالياً.</p>
                                            ) : (
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                    {activeDetail.videos.map((v) => (
                                                        <div key={v._id} className="p-2.5 rounded-xl bg-white/5 flex items-center justify-between text-xs">
                                                            <span className="text-slate-200 truncate">{v.title}</span>
                                                            {v.watched && <FiCheckCircle className="text-emerald-400 shrink-0" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Materials */}
                                        <div className="bg-[#0B1220]/80 rounded-2xl p-4 border border-white/10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                                    <FiFileText className="text-blue-400" /> المواد التعليمية ({activeDetail.materials.length})
                                                </h3>
                                                <Link href="/learn/materials" className="text-xs text-blue-400 hover:underline">
                                                    عرض الكل
                                                </Link>
                                            </div>
                                            {activeDetail.materials.length === 0 ? (
                                                <p className="text-xs text-slate-500">لا توجد ملفات مرفوعة حالياً.</p>
                                            ) : (
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                    {activeDetail.materials.map((m) => (
                                                        <a
                                                            key={m._id}
                                                            href={m.fileUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="block p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-200 truncate"
                                                        >
                                                            {m.title} ({m.materialType})
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Assignments */}
                                        <div className="bg-[#0B1220]/80 rounded-2xl p-4 border border-white/10 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                                                    <FiCheckSquare className="text-gold" /> التكليفات ({activeDetail.assignments.length})
                                                </h3>
                                                <Link href="/learn/assignments" className="text-xs text-blue-400 hover:underline">
                                                    التسليمات
                                                </Link>
                                            </div>
                                            {activeDetail.assignments.length === 0 ? (
                                                <p className="text-xs text-slate-500">لا توجد تكليفات حالياً.</p>
                                            ) : (
                                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                                    {activeDetail.assignments.map((a) => (
                                                        <div key={a._id} className="p-2.5 rounded-xl bg-white/5 text-xs">
                                                            <div className="font-semibold text-slate-200">{a.title}</div>
                                                            {a.deadline && (
                                                                <div className="text-[11px] text-amber-300 mt-0.5">
                                                                    Deadline: {new Date(a.deadline).toLocaleDateString('ar-EG')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="glass-panel rounded-3xl p-8 text-center border border-blue-500/20">
                            <p className="text-slate-300 text-sm">لم تنضم إلى أي مسار بعد. اختر مساراً من القائمة أدناه للبدء.</p>
                        </div>
                    )}

                    {/* Explore & Join Other Tracks */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-extrabold text-white">المسارات المتاحة في Switch Code</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableTracks.map((t) => {
                                const isEnrolled = enrolledIds.has(t._id);
                                return (
                                    <div key={t._id} className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4">
                                        <div>
                                            <span className="text-[11px] font-bold text-blue-400 uppercase">{t.category} • {t.level}</span>
                                            <h4 className="text-base font-extrabold text-white mt-1">{t.name}</h4>
                                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{t.description}</p>
                                        </div>
                                        {isEnrolled ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                                <FiCheckCircle /> مسجل بالفعل
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={enrollingId === t._id}
                                                onClick={() => handleEnroll(t._id)}
                                                className="btn-primary-blue py-2 px-4 text-xs inline-flex items-center justify-center gap-1.5"
                                            >
                                                <FiPlus /> {enrollingId === t._id ? 'جاري التسجيل...' : 'انضم للمسار'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </DashboardShell>
    );
}
