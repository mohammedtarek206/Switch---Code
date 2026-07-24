'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiUser, FiCalendar, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface Result {
    _id: string;
    studentId: { name: string, email: string };
    examId: { title: string };
    score: number;
    status: string;
    completedAt: string;
}

export default function AdminResults() {
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/results', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tighter">Student Exam Results</h1>
                <p className="text-gray-400">Monitor academic performance across all tracks.</p>
            </div>

            <div className="glass rounded-[2.5rem] overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.03]">
                            <tr>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest">Student</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest">Examination</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest">Score</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-xs font-black text-gray-500 uppercase tracking-widest">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {results.map((res) => (
                                <tr key={res._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center mr-4 text-primary font-black">
                                                {res.studentId?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{res.studentId?.name}</p>
                                                <p className="text-[10px] text-gray-500 font-medium">{res.studentId?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-white font-bold">{res.examId?.title}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center">
                                            <span className="text-xl font-black text-white mr-1">{res.score}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {res.status === 'Pass' ? (
                                            <span className="flex items-center text-xs font-black text-green-500 bg-green-500/10 px-3 py-1 rounded-full uppercase">
                                                <FiCheckCircle className="mr-2" /> Passed
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-xs font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full uppercase">
                                                <FiXCircle className="mr-2" /> Failed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-gray-500 text-xs font-bold uppercase">
                                        {new Date(res.completedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && results.length === 0 && (
                        <div className="text-center py-20 text-gray-600 font-bold uppercase tracking-widest">
                            No exam results found in database.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
