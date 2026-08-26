'use client';

import Link from 'next/link';
import { FiBook, FiYoutube, FiFileText, FiCheckSquare, FiClipboard, FiTrendingUp } from 'react-icons/fi';

const sections = [
    { title: 'LMS Tracks', description: 'Create and manage learning tracks for students', href: '/admin/lms/tracks', icon: FiBook, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { title: 'Video Lectures', description: 'Add and manage video content by track', href: '/admin/lms/videos', icon: FiYoutube, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { title: 'Reading Materials', description: 'Upload PDFs, docs, and links for each track', href: '/admin/lms/materials', icon: FiFileText, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { title: 'Quizzes', description: 'Create quizzes with multiple question types', href: '/admin/lms/quizzes', icon: FiCheckSquare, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { title: 'Assignments', description: 'Create assignments, view and grade submissions', href: '/admin/lms/assignments', icon: FiClipboard, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { title: 'Student Progress', description: 'Monitor individual student learning progress', href: '/admin/lms/progress', icon: FiTrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
];

export default function AdminLMSPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Learning Management System</h1>
                <p className="text-gray-400 text-sm mt-1">Manage all LMS content: tracks, videos, materials, quizzes, and assignments</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map(s => (
                    <Link
                        key={s.href}
                        href={s.href}
                        className={`group bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border ${s.border} hover:border-opacity-50 p-6 transition-all hover:scale-[1.01]`}
                    >
                        <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mb-4`}>
                            <s.icon className={`w-6 h-6 ${s.color}`} />
                        </div>
                        <h3 className="font-bold text-white text-base mb-1">{s.title}</h3>
                        <p className="text-gray-400 text-sm">{s.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
