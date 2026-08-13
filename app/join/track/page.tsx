'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiArrowLeft, FiClock, FiCheckCircle, FiXCircle, FiUser, FiCalendar, FiMapPin, FiGrid } from 'react-icons/fi';
import Link from 'next/link';

interface TrackerData {
    applicationCode: string;
    name: string;
    status: string; // 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected' | 'waiting'
    adminNote: string | null;
    committee: { name: string; color: string } | null;
    interview: {
        date?: string;
        interviewerName?: string;
        interviewStatus?: string;
        notes?: string;
        decision?: string;
    } | null;
    appliedAt: string;
    lastUpdated: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; step: number }> = {
    pending: { label: 'تم الاستلام', icon: FiClock, color: 'text-yellow-400', step: 1 },
    reviewing: { label: 'قيد المراجعة', icon: FiSearch, color: 'text-blue-400', step: 2 },
    interview: { label: 'مرحلة المقابلة', icon: FiUser, color: 'text-purple-400', step: 3 },
    waiting: { label: 'قائمة الانتظار', icon: FiClock, color: 'text-gray-400', step: 4 },
    accepted: { label: 'مقبول', icon: FiCheckCircle, color: 'text-green-400', step: 5 },
    rejected: { label: 'مرفوض', icon: FiXCircle, color: 'text-red-400', step: 5 },
};

export default function TrackApplicationPage() {
    const [code, setCode] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<TrackerData | null>(null);

    async function handleTrack(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');
        setData(null);

        try {
            const res = await fetch('/api/applicant/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationCode: code, identifier })
            });

            const result = await res.json();
            if (res.ok) {
                setData(result);
            } else {
                setError(result.error || 'لم يتم العثور على طلب بهذا الكود.');
            }
        } catch {
            setError('حدث خطأ في شبكة الاتصال، يرجى المحاولة لاحقاً.');
        } finally {
            setLoading(false);
        }
    }

    const currentStep = data ? (STATUS_CONFIG[data.status]?.step || 1) : 0;

    return (
        <div className="min-h-screen bg-dark text-white py-16 px-4 md:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/join" className="flex items-center text-gray-400 hover:text-white w-fit transition-colors">
                    <FiArrowLeft className="mr-2" /> العودة لصفحة التقديم
                </Link>

                <div className="text-center space-y-3 mb-8">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">متابعة الطلب <span className="text-accent">والانترفيو</span></h1>
                    <p className="text-gray-400">أدخل كود التقديم والبريد الإلكتروني/رقم الهاتف المرتبط بطلبك</p>
                </div>

                {!data ? (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass p-8 md:p-12 rounded-3xl border border-white/5 mx-auto max-w-xl shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full"></div>
                        <form onSubmit={handleTrack} className="space-y-6 relative z-10 text-right" dir="rtl">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center justify-center font-bold">
                                    <FiXCircle className="ml-2" /> {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm text-gray-300 font-bold block">Tracking Code (كود المتابعة)</label>
                                <input
                                    type="text"
                                    required
                                    value={code}
                                    onChange={e => setCode(e.target.value)}
                                    placeholder="APP-YYYY-XXXXXXXX"
                                    className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-center font-mono tracking-widest uppercase transition-all"
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-300 font-bold block">Email or Phone (البريد الإلكتروني أو الهاتف)</label>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    placeholder="مثال: name@domain.com أو 010..."
                                    className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-center font-mono transition-all"
                                    dir="ltr"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-accent hover:bg-accent-dark text-black p-4 rounded-xl font-extrabold flex items-center justify-center space-x-2 text-md transition-all pt-3.5 mt-8 shadow-[0_0_20px_rgba(0,255,136,0.1)] disabled:opacity-50"
                            >
                                {loading ? 'جاري البحث...' : 'متابعة الطلب الآن'}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 text-right" dir="rtl">
                        <div className="glass p-8 rounded-3xl border border-white/5 relative">
                            <button onClick={() => setData(null)} className="absolute top-6 left-6 text-gray-500 hover:text-white text-sm underline z-10 transition-colors">
                                بحث جديد
                            </button>
                            <h2 className="text-2xl font-black text-white mb-6">حالة طلبك ({data.committee?.name || 'لجنة غير محددة'})</h2>

                            {/* Timeline Component */}
                            <div className="mb-10 relative pt-8 pb-4">
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/5 rounded-full -translate-y-1/2 hidden md:block"></div>
                                <div className="absolute top-1/2 right-0 h-1 bg-accent rounded-full -translate-y-1/2 transition-all duration-1000 hidden md:block" style={{ width: `${(currentStep - 1) * 25}%` }}></div>
                                <div className="flex flex-col md:flex-row justify-between relative z-10 gap-6 md:gap-0">
                                    {[
                                        { s: 1, key: 'pending', title: 'تم التقديم' },
                                        { s: 2, key: 'reviewing', title: 'تحت المراجعة' },
                                        { s: 3, key: 'interview', title: 'المقابلة' },
                                        { s: 4, key: 'waiting', title: 'تحديد القرار' },
                                        { s: 5, key: data.status === 'rejected' ? 'rejected' : 'accepted', title: 'النتيجة النهائية' }
                                    ].map((step, idx) => {
                                        const isPast = currentStep > step.s || (currentStep === step.s && step.s === 5);
                                        const isCurrent = currentStep === step.s && step.s !== 5;
                                        const ST = STATUS_CONFIG[step.key];
                                        return (
                                            <div key={idx} className="flex md:flex-col items-center gap-4 md:gap-2 text-center relative w-full md:w-32">
                                                <div className={`w-12 h-12 md:mx-auto rounded-full flex items-center justify-center border-4 border-dark shrink-0 transition-all shadow-xl
                                                    ${isPast ? 'bg-accent text-black' : isCurrent ? 'bg-dark-light ring-2 ring-accent text-accent' : 'bg-white/5 text-gray-600'}`
                                                }>
                                                    {isPast ? <FiCheckCircle className="w-6 h-6" /> : (ST.icon ? <ST.icon className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-current"></div>)}
                                                </div>
                                                <div className={`font-bold text-sm ${isPast || isCurrent ? 'text-white' : 'text-gray-500'}`}>{step.title}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-5 bg-dark-light border border-white/5 rounded-2xl">
                                    <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2" dir="ltr">Applicant Name</div>
                                    <div className="text-lg font-bold text-white shrink-0">{data.name}</div>
                                </div>
                                <div className="p-5 bg-dark-light border border-white/5 rounded-2xl">
                                    <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2" dir="ltr">Application Code</div>
                                    <div className="font-mono text-xl font-black text-accent shrink-0 tracking-widest">{data.applicationCode}</div>
                                </div>
                            </div>

                            {/* Final Results Logic */}
                            {data.status === 'accepted' && (
                                <div className="mt-6 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center space-y-4">
                                    <h3 className="text-2xl font-black text-green-400">مبروك! 🎉 تم قبولك</h3>
                                    <p className="text-green-200">أهلاً بك في لجنة {data.committee?.name}. نتطلع للعمل معك!</p>
                                    <Link href={`/dashboard/committee`} className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-extrabold rounded-xl transition-all shadow-lg">
                                        <FiGrid /> دخول إلى لوحة تحكم اللجنة
                                    </Link>
                                </div>
                            )}

                            {data.status === 'rejected' && (
                                <div className="mt-6 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-2">
                                    <h3 className="text-xl font-bold text-red-400">نعتذر لك 😔</h3>
                                    <p className="text-red-200 text-sm">لم يحالفك الحظ هذه المرة للقبول في {data.committee?.name}. نتمنى لك التوفيق في المرات القادمة.</p>
                                    {data.adminNote && (
                                        <p className="mt-4 p-4 text-xs text-red-300 bg-black/20 rounded-xl inline-block max-w-lg text-right">
                                            ملاحظة: {data.adminNote}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {/* Interview Details if Scheduled or Active */}
                            {data.interview && (data.status === 'interview' || data.interview.interviewStatus !== 'Not Assigned') && data.status !== 'rejected' && data.status !== 'accepted' && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass p-8 rounded-3xl border border-accent/20">
                                    <h3 className="text-xl font-bold text-accent mb-6 flex items-center gap-2">
                                        <FiUser /> بيانات المقابلة الشخصية (Interview)
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <div className="text-gray-400 text-xs font-bold uppercase">تاريخ ووقت المقابلة</div>
                                            <div className="text-white font-bold flex items-center gap-2">
                                                <FiCalendar className="text-accent" />
                                                {data.interview.date ? new Date(data.interview.date).toLocaleString('ar-EG-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'سيتم التحديد قريباً'}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-gray-400 text-xs font-bold uppercase">مسؤول المقابلة</div>
                                            <div className="text-white font-bold">{data.interview.interviewerName || 'سيتم التعيين قريباً'}</div>
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <div className="text-gray-400 text-xs font-bold uppercase">الحالة</div>
                                            <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-gold font-bold">
                                                {data.interview.interviewStatus || 'لم يتم البدء'}
                                            </div>
                                        </div>
                                    </div>
                                    {data.adminNote && (
                                        <div className="mt-6 p-4 bg-accent/5 border border-accent/10 rounded-xl">
                                            <div className="text-accent text-xs font-bold mb-1">ملاحظات/رسالة لك:</div>
                                            <p className="text-sm text-gray-300 leading-relaxed">{data.adminNote}</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
