'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiUser, FiCheckCircle } from 'react-icons/fi';
import GoogleDrivePhotoInput from '@/components/GoogleDrivePhotoInput';
import DashboardShell from '@/components/DashboardShell';
import { formatGoogleDriveImageUrl } from '@/lib/googleDrive';

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [photoValid, setPhotoValid] = useState(true);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        accountStatus: '',
        governorate: '',
        university: '',
        academicYear: '',
        bio: '',
        goals: '',
        avatar: '',
        drivePhotoUrl: '',
        skills: '',
        linkedin: '',
        github: '',
        portfolio: '',
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetch('/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => {
                if (r.status === 401) {
                    router.push('/login');
                    return null;
                }
                return r.json();
            })
            .then((data) => {
                if (data?.user) {
                    const u = data.user;
                    setProfile({
                        name: u.name || '',
                        email: u.email || '',
                        phone: u.phone || '',
                        role: u.role || '',
                        accountStatus: u.accountStatus || 'active',
                        governorate: u.governorate || '',
                        university: u.university || '',
                        academicYear: u.academicYear || '',
                        bio: u.bio || '',
                        goals: u.goals || '',
                        avatar: u.avatar || '',
                        drivePhotoUrl: '',
                        skills: Array.isArray(u.skills) ? u.skills.join(', ') : '',
                        linkedin: u.social?.linkedin || '',
                        github: u.social?.github || '',
                        portfolio: u.social?.portfolio || '',
                    });
                }
            })
            .finally(() => setLoading(false));
    }, [router]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setMsg('');
        setError('');
        if (profile.drivePhotoUrl.trim() && !photoValid) {
            setError('يرجى التحقق من رابط صورة Google Drive أولاً.');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: profile.name,
                    phone: profile.phone,
                    governorate: profile.governorate,
                    university: profile.university,
                    academicYear: profile.academicYear,
                    bio: profile.bio,
                    goals: profile.goals,
                    drivePhotoUrl: profile.drivePhotoUrl || undefined,
                    skills: profile.skills.split(',').map((s) => s.trim()).filter(Boolean),
                    social: {
                        linkedin: profile.linkedin,
                        github: profile.github,
                        portfolio: profile.portfolio,
                    },
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'فشل تحديث البيانات');
            } else {
                setMsg('تم حفظ التعديلات بنجاح');
                if (data.user?.avatar) {
                    setProfile((p) => ({ ...p, avatar: data.user.avatar, drivePhotoUrl: '' }));
                }
                const stored = localStorage.getItem('user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem('user', JSON.stringify({ ...parsed, ...data.user }));
                }
            }
        } catch {
            setError('حدث خطأ في الاتصال');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <DashboardShell title="الملف الشخصي – My Profile">
                <div className="py-20 text-center text-slate-400">جاري تحميل الملف الشخصي...</div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell title="الملف الشخصي – My Profile">
            <div className="max-w-3xl mx-auto">
                <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-blue-500/20">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                        {profile.avatar ? (
                            <img
                                src={formatGoogleDriveImageUrl(profile.avatar)}
                                alt={profile.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-gold"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                                <FiUser className="w-7 h-7" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-extrabold text-white">{profile.name}</h1>
                            <p className="text-xs text-slate-400">{profile.email}</p>
                            <div className="flex gap-2 mt-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 uppercase">
                                    {profile.role}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300">
                                    {profile.accountStatus}
                                </span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-5">
                        {msg && (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                                <FiCheckCircle /> {msg}
                            </div>
                        )}
                        {error && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">Governorate</label>
                                <input
                                    type="text"
                                    value={profile.governorate}
                                    onChange={(e) => setProfile({ ...profile, governorate: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">University / School</label>
                                <input
                                    type="text"
                                    value={profile.university}
                                    onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                                />
                            </div>
                        </div>

                        <GoogleDrivePhotoInput
                            value={profile.drivePhotoUrl}
                            onChange={(url, valid) => {
                                setProfile((p) => ({ ...p, drivePhotoUrl: url }));
                                setPhotoValid(valid);
                            }}
                        />

                        <div>
                            <label className="block text-xs text-gray-300 mb-1">Bio</label>
                            <textarea
                                rows={3}
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-300 mb-1">Skills (comma separated)</label>
                            <input
                                type="text"
                                value={profile.skills}
                                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                                type="url"
                                placeholder="LinkedIn URL"
                                value={profile.linkedin}
                                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                                className="px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                            />
                            <input
                                type="url"
                                placeholder="GitHub URL"
                                value={profile.github}
                                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                                className="px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                            />
                            <input
                                type="url"
                                placeholder="Portfolio URL"
                                value={profile.portfolio}
                                onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                                className="px-3 py-2.5 rounded-xl bg-[#0B1220] border border-white/10 text-white text-xs"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary-blue px-6 py-3 text-sm inline-flex items-center gap-2"
                        >
                            <FiSave /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                        </button>
                    </form>
                </div>
            </div>
        </DashboardShell>
    );
}
