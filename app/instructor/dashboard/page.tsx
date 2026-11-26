'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FiBookOpen, FiUsers, FiYoutube, FiFileText, FiCheckSquare,
    FiClock, FiPlus, FiCheckCircle, FiBell
} from 'react-icons/fi';
import DashboardShell from '@/components/DashboardShell';

interface InstructorTrack {
    _id: string;
    name: string;
    category: string;
    level: string;
    description: string;
}

interface StudentItem {
    _id: string;
    name: string;
    email: string;
    university?: string;
    trackName?: string;
}

interface SubmissionItem {
    _id: string;
    userId?: { name: string; email: string };
    assignmentId?: { title: string; maxScore: number };
    submissionText?: string;
    submissionUrl?: string;
    status: string;
    score?: number;
    feedback?: string;
}

export default function InstructorDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'overview' | 'content' | 'submissions' | 'students'>('overview');
    const [tracks, setTracks] = useState<InstructorTrack[]>([]);
    const [availableTracks, setAvailableTracks] = useState<InstructorTrack[]>([]);
    const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [videos, setVideos] = useState<Array<{ _id: string; title: string; approvalStatus: string; trackId: string }>>([]);
    const [materials, setMaterials] = useState<Array<{
        _id: string;
        title: string;
        description?: string;
        fileUrl?: string;
        materialType?: string;
        lectureTitle?: string;
        approvalStatus: string;
        reviewFeedback?: string;
    }>>([]);
    const [lmsAssignments, setLmsAssignments] = useState<Array<{ _id: string; title: string; deadline?: string }>>([]);
    const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
    const [announcements, setAnnouncements] = useState<Array<{ _id: string; title: string; content: string }>>([]);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    // New content form
    const [contentType, setContentType] = useState<'video' | 'material' | 'assignment'>('video');
    const [form, setForm] = useState({
        trackId: '',
        title: '',
        description: '',
        videoUrl: '',
        duration: '',
        fileUrl: '',
        materialType: 'pdf',
        lectureTitle: '',
        notes: '',
        deadline: '',
        maxScore: '100',
        order: '0',
    });
    const [resubmitId, setResubmitId] = useState<string | null>(null);

    // Grading state
    const [gradeDraft, setGradeDraft] = useState<Record<string, { score: string; feedback: string }>>({});

    async function loadDashboard() {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            const res = await fetch('/api/instructor/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            if (res.status === 403) {
                router.push('/dashboard');
                return;
            }
            const data = await res.json();
            setTracks(data.tracks || []);
            setAvailableTracks(data.availableTracks || []);
            setStudents(data.students || []);
            setVideos(data.videos || []);
            setMaterials(data.materials || []);
            setLmsAssignments(data.lmsAssignments || []);
            setSubmissions(data.submissions || []);
            setAnnouncements(data.announcements || []);
            if (data.tracks?.length > 0 && !form.trackId) {
                setForm((f) => ({ ...f, trackId: data.tracks[0]._id }));
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDashboard();
    }, []);

    async function handleCreateContent(e: React.FormEvent) {
        e.preventDefault();
        setMsg('');
        setError('');
        const token = localStorage.getItem('token');
        if (!token) return;

        const isResubmit = Boolean(resubmitId && contentType === 'material');
        const res = await fetch('/api/instructor/content', {
            method: isResubmit ? 'PATCH' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(
                isResubmit
                    ? { materialId: resubmitId, ...form }
                    : { contentType, ...form }
            ),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || 'فشل إضافة المحتوى');
            return;
        }
        setMsg(data.message || 'تمت الإضافة بنجاح');
        setResubmitId(null);
        setForm((f) => ({ ...f, title: '', description: '', videoUrl: '', fileUrl: '', lectureTitle: '', notes: '' }));
        await loadDashboard();
    }

    async function handleGrade(submissionId: string, status: 'graded' | 'returned') {
        const token = localStorage.getItem('token');
        if (!token) return;
        const draft = gradeDraft[submissionId] || { score: '', feedback: '' };
        const res = await fetch('/api/instructor/submissions', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                submissionId,
                score: draft.score ? Number(draft.score) : undefined,
                feedback: draft.feedback,
                status,
            }),
        });
        if (res.ok) {
            setMsg('تم حفظ تقييم الطالب وإرسال إشعار له.');
            await loadDashboard();
        }
    }

    async function handleAssignMyTracks() {
        const token = localStorage.getItem('token');
        if (!token || selectedTrackIds.length === 0) return;
        const res = await fetch('/api/instructor/tracks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ trackIds: selectedTrackIds }),
        });
        if (res.ok) {
            setMsg('تم ربطك بالمسارات المختارة بنجاح.');
            await loadDashboard();
        }
    }

    return (
        <DashboardShell title="Instructor Dashboard – لوحة المحاضر">
            {loading ? (
                <div className="text-center py-20 text-slate-400">جاري تحميل لوحة المحاضر...</div>
            ) : (
                <div className="space-y-6">
                    {tracks.length === 0 && availableTracks.length > 0 && (
                        <div className="glass-panel rounded-3xl p-6 border border-gold/30 space-y-4">
                            <h2 className="text-lg font-extrabold text-white">اختر المسارات التي تدرّسها للبدء فوراً</h2>
                            <p className="text-xs text-slate-300">
                                لم تقم باختيار تخصصاتك بعد. حدد المسارات المناسبة لك أدناه لإدارة الدروس والطلاب مباشرة:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {availableTracks.map((tr) => {
                                    const picked = selectedTrackIds.includes(tr._id);
                                    return (
                                        <button
                                            key={tr._id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedTrackIds((prev) =>
                                                    prev.includes(tr._id) ? prev.filter((x) => x !== tr._id) : [...prev, tr._id]
                                                )
                                            }
                                            className={`p-3 rounded-xl border text-left text-xs ${
                                                picked ? 'bg-amber-500/20 border-gold text-white' : 'bg-[#0B1220] border-white/10 text-slate-300'
                                            }`}
                                        >
                                            <div className="font-bold">{tr.name}</div>
                                            <div className="text-[11px] text-slate-400">{tr.category}</div>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                disabled={selectedTrackIds.length === 0}
                                onClick={handleAssignMyTracks}
                                className="btn-primary-blue px-6 py-2.5 text-xs disabled:opacity-50"
                            >
                                حفظ المسارات والبدء
                            </button>
                        </div>
                    )}
                    {msg && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                            <FiCheckCircle /> {msg}
                        </div>
                    )}
                    {error && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-xs text-slate-400">My Tracks</div>
                            <div className="text-2xl font-black text-white mt-1">{tracks.length}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-xs text-slate-400">My Students</div>
                            <div className="text-2xl font-black text-blue-400 mt-1">{students.length}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-xs text-slate-400">Lessons & Videos</div>
                            <div className="text-2xl font-black text-gold mt-1">{videos.length}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-xs text-slate-400">Materials</div>
                            <div className="text-2xl font-black text-emerald-400 mt-1">{materials.length}</div>
                        </div>
                        <div className="glass-card rounded-2xl p-4">
                            <div className="text-xs text-slate-400">Submissions</div>
                            <div className="text-2xl font-black text-pink-400 mt-1">{submissions.length}</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'overview', label: 'نظرة عامة ومساراتي' },
                            { id: 'content', label: 'إضافة درس / مادة / تكليف' },
                            { id: 'submissions', label: `تسليمات الطلاب (${submissions.length})` },
                            { id: 'students', label: `طلابي (${students.length})` },
                        ].map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id as typeof tab)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    tab === t.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-[#0B1220] text-slate-300 border border-white/10 hover:border-blue-500/40'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <FiBookOpen className="text-blue-400" /> المسارات المخصصة لي
                                </h3>
                                {tracks.length === 0 ? (
                                    <p className="text-xs text-slate-400">لم يتم تعيين مسارات لك بعد. تواصل مع الإدارة.</p>
                                ) : (
                                    tracks.map((tr) => (
                                        <div key={tr._id} className="p-3.5 rounded-xl bg-[#0B1220] border border-white/10">
                                            <div className="font-bold text-sm text-white">{tr.name}</div>
                                            <div className="text-xs text-slate-400 mt-1">{tr.description}</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <FiBell className="text-gold" /> أحدث الإعلانات
                                </h3>
                                {announcements.length === 0 ? (
                                    <p className="text-xs text-slate-400">لا توجد إعلانات حالياً.</p>
                                ) : (
                                    announcements.map((a) => (
                                        <div key={a._id} className="p-3 rounded-xl bg-[#0B1220] border border-white/10">
                                            <div className="font-bold text-xs text-gold">{a.title}</div>
                                            <div className="text-xs text-slate-300 mt-1">{a.content}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {tab === 'content' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <form onSubmit={handleCreateContent} className="glass-panel rounded-2xl p-6 border border-blue-500/20 space-y-4">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <FiPlus className="text-gold" /> إضافة محتوى جديد
                                </h3>

                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'video', label: 'فيديو / درس', icon: FiYoutube },
                                        { id: 'material', label: 'ملف / مادة', icon: FiFileText },
                                        { id: 'assignment', label: 'Assignment', icon: FiCheckSquare },
                                    ].map((c) => {
                                        const Icon = c.icon;
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setContentType(c.id as typeof contentType)}
                                                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                                                    contentType === c.id
                                                        ? 'bg-blue-600 border-blue-400 text-white'
                                                        : 'bg-[#0B1220] border-white/10 text-slate-300'
                                                }`}
                                            >
                                                <Icon /> {c.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-300 mb-1">المسار (Track) *</label>
                                    <select
                                        required
                                        value={form.trackId}
                                        onChange={(e) => setForm({ ...form, trackId: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                    >
                                        {tracks.map((tr) => (
                                            <option key={tr._id} value={tr._id}>{tr.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-300 mb-1">العنوان *</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-300 mb-1">الوصف</label>
                                    <textarea
                                        rows={2}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                    />
                                </div>

                                {contentType === 'video' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-300 mb-1">رابط الفيديو *</label>
                                            <input
                                                type="url"
                                                required
                                                value={form.videoUrl}
                                                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                                                placeholder="YouTube / Google Drive URL"
                                                className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-300 mb-1">المدة (مثال: 45 min)</label>
                                            <input
                                                type="text"
                                                value={form.duration}
                                                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                {contentType === 'material' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-300 mb-1">رابط الملف / المورد *</label>
                                                <input
                                                    type="url"
                                                    required
                                                    value={form.fileUrl}
                                                    onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-300 mb-1">نوع المادة</label>
                                                <select
                                                    value={form.materialType}
                                                    onChange={(e) => setForm({ ...form, materialType: e.target.value })}
                                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                                >
                                                    <option value="pdf">PDF File</option>
                                                    <option value="word">Word Document</option>
                                                    <option value="powerpoint">PowerPoint Presentation</option>
                                                    <option value="excel">Excel File</option>
                                                    <option value="image">Image</option>
                                                    <option value="video">Educational Video</option>
                                                    <option value="drive_link">Google Drive Link</option>
                                                    <option value="youtube">YouTube Link</option>
                                                    <option value="zip">ZIP / Source Code Project</option>
                                                    <option value="link">External Resource</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-300 mb-1">اسم المحاضرة (Lecture)</label>
                                                <input
                                                    type="text"
                                                    value={form.lectureTitle}
                                                    onChange={(e) => setForm({ ...form, lectureTitle: e.target.value })}
                                                    placeholder="مثال: Lecture 3 - Hooks"
                                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-300 mb-1">ملاحظات إضافية (اختياري)</label>
                                                <input
                                                    type="text"
                                                    value={form.notes}
                                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-amber-300/90">
                                            * تخضع المواد التعليمية لمراجعة واعتماد الإدارة (Pending Review) قبل إتاحتها للطلاب.
                                        </p>
                                    </div>
                                )}

                                {contentType === 'assignment' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-300 mb-1">Deadline</label>
                                            <input
                                                type="datetime-local"
                                                value={form.deadline}
                                                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-300 mb-1">الدرجة العظمى</label>
                                            <input
                                                type="number"
                                                value={form.maxScore}
                                                onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
                                                className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button type="submit" disabled={!form.trackId} className="w-full btn-primary-blue py-3 text-sm">
                                    حفظ وإرسال
                                </button>
                            </form>

                            <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
                                <h3 className="font-bold text-white">المحتوى المضاف في مساراتك</h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {videos.map((v) => (
                                        <div key={v._id} className="p-3 rounded-xl bg-[#0B1220] border border-white/10 flex items-center justify-between text-xs">
                                            <span>🎬 {v.title}</span>
                                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">{v.approvalStatus}</span>
                                        </div>
                                    ))}
                                    {materials.map((m) => (
                                        <div key={m._id} className="p-3 rounded-xl bg-[#0B1220] border border-white/10 space-y-1.5 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-white">📄 {m.title}</span>
                                                <span className={`px-2 py-0.5 rounded font-bold ${
                                                    m.approvalStatus === 'approved'
                                                        ? 'bg-emerald-500/20 text-emerald-300'
                                                        : m.approvalStatus === 'rejected'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-amber-500/20 text-gold'
                                                }`}>
                                                    {m.approvalStatus}
                                                </span>
                                            </div>
                                            {m.reviewFeedback && (
                                                <p className="text-[11px] text-amber-300">ملاحظات الإدارة: {m.reviewFeedback}</p>
                                            )}
                                            {(m.approvalStatus === 'changes_requested' || m.approvalStatus === 'rejected') && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setContentType('material');
                                                        setResubmitId(m._id);
                                                        setForm((f) => ({
                                                            ...f,
                                                            title: m.title,
                                                            description: m.description || '',
                                                            fileUrl: m.fileUrl || '',
                                                            materialType: m.materialType || 'pdf',
                                                            lectureTitle: m.lectureTitle || '',
                                                        }));
                                                    }}
                                                    className="text-[11px] text-blue-400 hover:underline font-bold"
                                                >
                                                    تعديل وإعادة إرسال للمراجعة
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {lmsAssignments.map((a) => (
                                        <div key={a._id} className="p-3 rounded-xl bg-[#0B1220] border border-white/10 flex items-center justify-between text-xs">
                                            <span>📝 {a.title}</span>
                                            <span className="text-amber-300">{a.deadline ? new Date(a.deadline).toLocaleDateString('ar-EG') : 'Open'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {tab === 'submissions' && (
                        <div className="space-y-3">
                            {submissions.length === 0 ? (
                                <div className="glass-panel rounded-2xl p-8 text-center text-slate-400 text-sm">
                                    لا توجد تسليمات من الطلاب حتى الآن.
                                </div>
                            ) : (
                                submissions.map((s) => (
                                    <div key={s._id} className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <div className="font-bold text-white text-sm">
                                                    {s.userId?.name} – <span className="text-gold">{s.assignmentId?.title}</span>
                                                </div>
                                                <div className="text-xs text-slate-400">{s.userId?.email}</div>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300">
                                                {s.status} {s.score !== undefined ? `(${s.score}/${s.assignmentId?.maxScore || 100})` : ''}
                                            </span>
                                        </div>
                                        {s.submissionText && <p className="text-xs text-slate-300 bg-[#0B1220] p-3 rounded-xl">{s.submissionText}</p>}
                                        {s.submissionUrl && (
                                            <a href={s.submissionUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline inline-block">
                                                فتح رابط التسليم
                                            </a>
                                        )}
                                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                            <input
                                                type="number"
                                                placeholder="الدرجة"
                                                value={gradeDraft[s._id]?.score ?? (s.score !== undefined ? String(s.score) : '')}
                                                onChange={(e) =>
                                                    setGradeDraft((prev) => ({
                                                        ...prev,
                                                        [s._id]: { score: e.target.value, feedback: prev[s._id]?.feedback ?? s.feedback ?? '' },
                                                    }))
                                                }
                                                className="w-28 px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                            />
                                            <input
                                                type="text"
                                                placeholder="ملاحظات / Feedback للطالب"
                                                value={gradeDraft[s._id]?.feedback ?? (s.feedback || '')}
                                                onChange={(e) =>
                                                    setGradeDraft((prev) => ({
                                                        ...prev,
                                                        [s._id]: { score: prev[s._id]?.score ?? '', feedback: e.target.value },
                                                    }))
                                                }
                                                className="flex-1 px-3 py-2 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleGrade(s._id, 'graded')}
                                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                                            >
                                                اعتماد الدرجة
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleGrade(s._id, 'returned')}
                                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
                                            >
                                                طلب تعديل
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {tab === 'students' && (
                        <div className="glass-panel rounded-2xl p-5 border border-white/10 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-white/10 text-slate-400">
                                        <th className="py-2.5 px-3">Student</th>
                                        <th className="py-2.5 px-3">Email</th>
                                        <th className="py-2.5 px-3">Track</th>
                                        <th className="py-2.5 px-3">University</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {students.map((st) => (
                                        <tr key={st._id}>
                                            <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                                                <FiUsers className="text-blue-400" /> {st.name}
                                            </td>
                                            <td className="py-2.5 px-3 text-slate-300">{st.email}</td>
                                            <td className="py-2.5 px-3 text-gold">{st.trackName}</td>
                                            <td className="py-2.5 px-3 text-slate-400">{st.university || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </DashboardShell>
    );
}
