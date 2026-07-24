'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiKey, FiPlus, FiCopy, FiCheck, FiTrash2, FiClock, FiUser } from 'react-icons/fi';

interface AccessCode {
    _id: string;
    code: string;
    isUsed: boolean;
    studentId?: { name: string };
    trackId?: { title: string };
    createdAt: string;
}

export default function AdminCodes() {
    const [codes, setCodes] = useState<AccessCode[]>([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(1);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchCodes();
    }, []);

    const fetchCodes = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/codes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCodes(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/codes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ count }),
            });
            if (res.ok) {
                fetchCodes();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 text-right">أكواد الدخول</h1>
                <p className="text-gray-400 text-right">قم بتوليد أكواد للطلاب للوصول إلى المنصة.</p>
            </div>

            <div className="glass p-8 rounded-2xl flex flex-col md:flex-row items-end gap-6 border-accent/20 border-t-2">
                <div className="flex-1 w-full space-y-2">
                    <label className="text-gray-400 text-sm block text-right">عدد الأكواد المطلوب توليدها</label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={count}
                        onChange={(e) => setCount(parseInt(e.target.value))}
                        className="w-full bg-dark/50 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none text-right"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-accent hover:bg-accent/80 text-dark font-black px-8 py-3.5 rounded-xl flex items-center transition-all disabled:opacity-50"
                >
                    {loading ? 'توليد...' : 'توليد الأكواد'} <FiKey className="ml-2" />
                </button>
            </div>

            <div className="glass rounded-2xl overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-right" dir="rtl">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-gray-400 font-medium">الكود</th>
                                <th className="px-6 py-4 text-gray-400 font-medium">الحالة</th>
                                <th className="px-6 py-4 text-gray-400 font-medium">الطالب</th>
                                <th className="px-6 py-4 text-gray-400 font-medium">تاريخ الإنشاء</th>
                                <th className="px-6 py-4 text-gray-400 font-medium">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {codes.map((code) => (
                                <tr key={code._id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-white text-lg font-bold">{code.code}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {code.isUsed ? (
                                            <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-xs border border-red-500/20">
                                                مستخدم
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs border border-green-500/20">
                                                متاح
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {code.studentId ? (
                                            <div className="flex items-center text-gray-300">
                                                <FiUser className="ml-2 text-accent" /> {code.studentId.name}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {new Date(code.createdAt).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => copyToClipboard(code.code, code._id)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-all hover:text-white"
                                            title="نسخ الكود"
                                        >
                                            {copiedId === code._id ? <FiCheck className="text-green-500" /> : <FiCopy />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {codes.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            لا توجد أكواد مولدة بعد.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
