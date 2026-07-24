'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiMail, FiCalendar, FiShield } from 'react-icons/fi';

interface Student {
    _id: string;
    name: string;
    email?: string;
    role: string;
    createdAt: string;
}

export default function AdminStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/admin/students', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setStudents(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Platform Students</h1>
                <p className="text-gray-400">View and manage all registered students and admins.</p>
            </div>

            <div className="glass rounded-2xl overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-gray-400 font-medium">Name</th>
                                <th className="px-6 py-4 text-gray-400 font-medium">Role</th>
                                <th className="px-6 py-4 text-gray-400 font-medium">Contact</th>
                                <th className="px-6 py-4 text-gray-400 font-medium">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {students.map((student) => (
                                <tr key={student._id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-3">
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-white font-medium">{student.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {student.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-sm">
                                            <span className="text-gray-300 flex items-center"><FiMail className="mr-2 opacity-50" /> {student.email || 'No Email (Code Login)'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        <div className="flex items-center">
                                            <FiCalendar className="mr-2 opacity-50" />
                                            {new Date(student.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {students.length === 0 && !loading && (
                        <div className="text-center py-12 text-gray-500">
                            No users found in the database.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
