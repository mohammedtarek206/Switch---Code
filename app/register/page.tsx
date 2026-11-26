'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FiUser, FiMail, FiPhone, FiLock, FiMapPin, FiBookOpen,
    FiAward, FiUsers, FiCheckCircle, FiArrowRight, FiBriefcase
} from 'react-icons/fi';
import GoogleDrivePhotoInput from '@/components/GoogleDrivePhotoInput';

type AccountType = 'student' | 'instructor' | 'committee_member';

interface TrackOption {
    _id: string;
    name: string;
    category: string;
    level: string;
}

interface CommitteeOption {
    _id: string;
    name: string;
    description: string;
    type: string;
    maxMembers?: number;
    currentMemberCount?: number;
}

const GOVERNORATES = [
    'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Sharqia', 'Qalyubia', 'Gharbia',
    'Monufia', 'Beheira', 'Kafr El Sheikh', 'Damietta', 'Port Said', 'Ismailia',
    'Suez', 'Fayoum', 'Beni Suef', 'Minya', 'Assiut', 'Sohag', 'Qena', 'Luxor',
    'Aswan', 'Red Sea', 'New Valley', 'Matrouh', 'North Sinai', 'South Sinai', 'Outside Egypt',
];

export default function RegisterPage() {
    const router = useRouter();
    const [accountType, setAccountType] = useState<AccountType>('student');
    const [alsoJoinCommittee, setAlsoJoinCommittee] = useState(false);
    const [alsoJoinStudent, setAlsoJoinStudent] = useState(false);

    const [tracks, setTracks] = useState<TrackOption[]>([]);
    const [committees, setCommittees] = useState<CommitteeOption[]>([]);
    const [closedCommittees, setClosedCommittees] = useState<CommitteeOption[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [photoValid, setPhotoValid] = useState(true);

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        governorate: 'Cairo',
        university: '',
        academicYear: '',
        graduationYear: '',
        drivePhotoUrl: '',
        bio: '',
        termsAccepted: false,
        // Student
        interestedTrackIds: [] as string[],
        goals: '',
        // Instructor
        skills: '',
        experienceYears: '1',
        previousExperience: '',
        linkedin: '',
        github: '',
        portfolio: '',
        teachingTrackIds: [] as string[],
        // Committee Member
        committeeId: '',
    });

    useEffect(() => {
        fetch('/api/public/registration-options')
            .then((r) => r.json())
            .then((data) => {
                setTracks(data.tracks || []);
                setCommittees(data.committees || []);
                setClosedCommittees(data.closedCommittees || []);
            })
            .catch(() => {})
            .finally(() => setLoadingOptions(false));
    }, []);

    function toggleTrack(listKey: 'interestedTrackIds' | 'teachingTrackIds', id: string) {
        setForm((prev) => {
            const exists = prev[listKey].includes(id);
            return {
                ...prev,
                [listKey]: exists ? prev[listKey].filter((x) => x !== id) : [...prev[listKey], id],
            };
        });
    }

    const showCommitteeSelector =
        accountType === 'committee_member' ||
        ((accountType === 'student' || accountType === 'instructor') && alsoJoinCommittee);

    const showStudentFields =
        accountType === 'student' ||
        (accountType === 'committee_member' && alsoJoinStudent);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
        if (form.drivePhotoUrl.trim() && !photoValid) {
            setError('يرجى التحقق من صحة رابط صورة Google Drive أو مسح الحقل وإضافته لاحقاً.');
            return;
        }
        if (showCommitteeSelector && !form.committeeId) {
            setError('يرجى اختيار اللجنة التي تريد الانضمام إليها.');
            return;
        }
        if (!form.termsAccepted) {
            setError('يجب الموافقة على الشروط والأحكام وسياسة الخصوصية.');
            return;
        }

        const additionalRoles: string[] = [];
        if (alsoJoinCommittee && accountType !== 'committee_member') additionalRoles.push('member');
        if (alsoJoinStudent && accountType === 'committee_member') additionalRoles.push('student');

        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/self-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountType,
                    additionalRoles,
                    ...form,
                    experienceYears: Number(form.experienceYears) || 0,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'فشل إنشاء الحساب.');
                return;
            }

            // Instant Auto-Login & Direct Redirect to Dashboard
            if (data.token) localStorage.setItem('token', data.token);
            if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
            router.push(data.dashboardRoute || '/dashboard');
        } catch {
            setError('حدث خطأ في الاتصال بالخادم.');
        } finally {
            setSubmitting(false);
        }
    }

    const accountTypes: { id: AccountType; title: string; subtitle: string; icon: React.ElementType }[] = [
        { id: 'student', title: 'Student – طالب', subtitle: 'التعلم في المسارات والفعاليات', icon: FiBookOpen },
        { id: 'instructor', title: 'Instructor – محاضر', subtitle: 'تقديم الشروحات وإدارة المسارات', icon: FiAward },
        { id: 'committee_member', title: 'Committee Member – عضو لجنة', subtitle: 'الانضمام المباشر لفرق العمل', icon: FiUsers },
    ];

    return (
        <div className="min-h-screen bg-[#07111F] py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-black text-white">
                        انضم إلى <span className="text-gold">Switch Code Community</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">
                        أنشئ حسابك الآن وابدأ فوراً داخل لوحة التحكم الخاصة بدورك
                    </p>
                </div>

                {/* Account Type Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {accountTypes.map((type) => {
                        const Icon = type.icon;
                        const active = accountType === type.id;
                        return (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setAccountType(type.id)}
                                className={`p-4 rounded-2xl border text-right transition-all ${
                                    active
                                        ? 'bg-blue-600/20 border-gold shadow-lg shadow-blue-900/30'
                                        : 'bg-[#0B1220]/70 border-white/10 hover:border-blue-500/40'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Icon className={`w-6 h-6 ${active ? 'text-gold' : 'text-blue-400'}`} />
                                    {active && <FiCheckCircle className="w-4 h-4 text-gold" />}
                                </div>
                                <div className="font-bold text-white text-sm">{type.title}</div>
                                <div className="text-xs text-slate-400 mt-0.5">{type.subtitle}</div>
                            </button>
                        );
                    })}
                </div>

                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-blue-500/20"
                >
                    {error && (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold text-center">
                            {error}
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-white/10 pb-2">
                            البيانات الأساسية
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name *</label>
                                <div className="relative">
                                    <FiUser className="absolute left-3 top-3 text-gray-500" />
                                    <input
                                        type="text"
                                        required
                                        value={form.fullName}
                                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                        placeholder="الاسم ثلاثي"
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address *</label>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-3 text-gray-500" />
                                    <input
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="name@example.com"
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Phone Number *</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-3 top-3 text-gray-500" />
                                    <input
                                        type="tel"
                                        required
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="010xxxxxxxx"
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Governorate *</label>
                                <div className="relative">
                                    <FiMapPin className="absolute left-3 top-3 text-gray-500" />
                                    <select
                                        value={form.governorate}
                                        onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                    >
                                        {GOVERNORATES.map((g) => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">
                                    {accountType === 'instructor' ? 'University / Professional Background *' : 'University / School *'}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.university}
                                    onChange={(e) => setForm({ ...form, university: e.target.value })}
                                    placeholder={accountType === 'instructor' ? 'Computer Science / Software Engineer' : 'جامعة القاهرة / مدرسة ...'}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                />
                            </div>

                            {accountType !== 'instructor' ? (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Academic Year</label>
                                    <input
                                        type="text"
                                        value={form.academicYear}
                                        onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                                        placeholder="مثال: الفرقة الثالثة / خريج"
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Years of Experience *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        required
                                        value={form.experienceYears}
                                        onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Password * (min 8 chars)</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-3 text-gray-500" />
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Confirm Password *</label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-3 text-gray-500" />
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={form.confirmPassword}
                                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <GoogleDrivePhotoInput
                            value={form.drivePhotoUrl}
                            onChange={(url, valid) => {
                                setForm((prev) => ({ ...prev, drivePhotoUrl: url }));
                                setPhotoValid(valid);
                            }}
                        />

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">نبذة شخصية قصيرة (اختيارية)</label>
                            <textarea
                                rows={2}
                                value={form.bio}
                                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                placeholder="عرفنا بنفسك باختصار..."
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Multi-Role Opt-In */}
                    <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 space-y-2">
                        {accountType !== 'committee_member' ? (
                            <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={alsoJoinCommittee}
                                    onChange={(e) => setAlsoJoinCommittee(e.target.checked)}
                                    className="rounded border-white/20 bg-[#0B1220]"
                                />
                                <span>أرغب أيضاً في الانضمام كـ <strong>Committee Member</strong> في إحدى اللجان بنفس الحساب</span>
                            </label>
                        ) : (
                            <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={alsoJoinStudent}
                                    onChange={(e) => setAlsoJoinStudent(e.target.checked)}
                                    className="rounded border-white/20 bg-[#0B1220]"
                                />
                                <span>أرغب أيضاً في التعلم كـ <strong>Student</strong> في المسارات التعليمية بنفس الحساب</span>
                            </label>
                        )}
                    </div>

                    {/* Student Specific Fields */}
                    {showStudentFields && (
                        <div className="space-y-4 pt-2 border-t border-white/10">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gold">
                                المسارات التعليمية (Student Tracks)
                            </h3>
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-2">
                                    اختر المسارات التي تريد البدء فيها الآن (يمكنك تعديلها لاحقاً)
                                </label>
                                {loadingOptions ? (
                                    <p className="text-xs text-gray-400">جاري تحميل المسارات...</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {tracks.map((t) => {
                                            const selected = form.interestedTrackIds.includes(t._id);
                                            return (
                                                <button
                                                    key={t._id}
                                                    type="button"
                                                    onClick={() => toggleTrack('interestedTrackIds', t._id)}
                                                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                                                        selected
                                                            ? 'bg-blue-600/20 border-blue-400 text-white'
                                                            : 'bg-[#0B1220] border-white/10 text-gray-300 hover:border-white/30'
                                                    }`}
                                                >
                                                    <div className="font-bold">{t.name}</div>
                                                    <div className="text-[11px] text-gray-400">{t.category} • {t.level}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">
                                    أهدافك من الانضمام إلى Switch Code
                                </label>
                                <textarea
                                    rows={2}
                                    value={form.goals}
                                    onChange={(e) => setForm({ ...form, goals: e.target.value })}
                                    placeholder="ماذا تتمنى أن تتعلم أو تحققه معنا؟"
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Instructor Specific Fields */}
                    {accountType === 'instructor' && (
                        <div className="space-y-4 pt-2 border-t border-white/10">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gold">
                                بيانات المحاضر والتخصصات
                            </h3>
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-2">
                                    المسارات التي يمكنك تدريسها (اختياري الآن ويمكنك إضافتها من لوحة المحاضر)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {tracks.map((t) => {
                                        const selected = form.teachingTrackIds.includes(t._id);
                                        return (
                                            <button
                                                key={t._id}
                                                type="button"
                                                onClick={() => toggleTrack('teachingTrackIds', t._id)}
                                                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                                                    selected
                                                        ? 'bg-amber-500/20 border-gold text-white'
                                                        : 'bg-[#0B1220] border-white/10 text-gray-300 hover:border-white/30'
                                                }`}
                                            >
                                                <div className="font-bold">{t.name}</div>
                                                <div className="text-[11px] text-gray-400">{t.category}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Technical Skills</label>
                                    <input
                                        type="text"
                                        value={form.skills}
                                        onChange={(e) => setForm({ ...form, skills: e.target.value })}
                                        placeholder="React, TypeScript, Node.js..."
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">LinkedIn Profile (Optional)</label>
                                    <input
                                        type="url"
                                        value={form.linkedin}
                                        onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">GitHub Profile (Optional)</label>
                                    <input
                                        type="url"
                                        value={form.github}
                                        onChange={(e) => setForm({ ...form, github: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-300 mb-1">Portfolio URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={form.portfolio}
                                        onChange={(e) => setForm({ ...form, portfolio: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">Previous Experience</label>
                                <textarea
                                    rows={2}
                                    value={form.previousExperience}
                                    onChange={(e) => setForm({ ...form, previousExperience: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Committee Selection */}
                    {showCommitteeSelector && (
                        <div className="space-y-4 pt-2 border-t border-white/10">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gold flex items-center gap-2">
                                <FiBriefcase /> اختيار اللجنة للانضمام المباشر
                            </h3>

                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-1">اللجنة المتاحة *</label>
                                <select
                                    required
                                    value={form.committeeId}
                                    onChange={(e) => setForm({ ...form, committeeId: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="">-- اختر اللجنة --</option>
                                    {committees.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {form.committeeId && (
                                    <p className="text-xs text-blue-300 mt-1.5">
                                        {committees.find((c) => c._id === form.committeeId)?.description}
                                    </p>
                                )}
                                {closedCommittees.length > 0 && (
                                    <p className="text-[11px] text-slate-400 mt-2">
                                        لجان مغلقة للتسجيل حالياً: {closedCommittees.map((c) => c.name).join('، ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Terms */}
                    <div className="flex items-start gap-2.5 pt-2">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={form.termsAccepted}
                            onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
                            className="mt-1 rounded border-white/20 bg-[#0B1220]"
                        />
                        <label htmlFor="terms" className="text-xs text-slate-300 leading-relaxed">
                            أوافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمجتمع Switch Code، وأقر بصحة البيانات المدخلة.
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full btn-primary-blue py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {submitting ? 'جاري إنشاء الحساب والدخول...' : 'Create Account – إنشاء الحساب والدخول فوراً'}
                        <FiArrowRight />
                    </button>

                    <div className="text-center text-xs text-slate-400">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/login" className="text-gold hover:underline font-bold">
                            تسجيل الدخول
                        </Link>
                    </div>
                </motion.form>
            </div>
        </div>
    );
}
