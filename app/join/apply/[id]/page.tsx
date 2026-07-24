'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Link from 'next/link';

interface FormField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'email' | 'phone' | 'dropdown' | 'checkbox' | 'radio' | 'date' | 'file' | 'cv' | 'linkedin' | 'github' | 'portfolio';
    placeholder?: string;
    required: boolean;
    options?: string[];
}

interface Recruitment {
    _id: string;
    name: string;
    formFields: FormField[];
}

export default function ApplyPage({ params, searchParams }: { params: { id: string }; searchParams: { committeeId?: string } }) {
    const [cycle, setCycle] = useState<Recruitment | null>(null);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Primary Contact Info states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [university, setUniversity] = useState('');
    const [faculty, setFaculty] = useState('');

    // Dynamic answers dictionary
    const [formData, setFormData] = useState<Record<string, string>>({});

    useEffect(() => {
        async function fetchFormFields() {
            try {
                const res = await fetch('/api/join');
                if (res.ok) {
                    const data = await res.json();
                    setCycle(data);
                    // Prepopulate dynamic answers with blanks
                    const initialData: Record<string, string> = {};
                    data.formFields?.forEach((f: FormField) => {
                        initialData[f.id] = '';
                    });
                    setFormData(initialData);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchFormFields();
    }, [params.id]);

    function handleInputChange(fieldId: string, val: string) {
        setFormData({
            ...formData,
            [fieldId]: val
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!searchParams.committeeId) {
            setErrorMsg('No target committee chosen.');
            return;
        }

        const payload = {
            recruitmentId: params.id,
            committeeId: searchParams.committeeId,
            name,
            email,
            phone,
            university,
            faculty,
            formData
        };

        try {
            const res = await fetch('/api/community/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                const data = await res.json();
                setErrorMsg(data.error || 'Submission failed');
            }
        } catch {
            setErrorMsg('Network error submitting your application.');
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!cycle) {
        return (
            <div className="min-h-screen bg-dark text-white flex flex-col justify-center items-center py-20">
                <FiAlertCircle className="w-12 h-12 text-gray-500 mb-4" />
                <p className="text-gray-400">Recruitment cycle parameters have expired or are unavailable.</p>
                <Link href="/join" className="text-accent underline mt-2">Back</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark text-white py-16 px-4 md:px-8">
            <div className="max-w-2xl mx-auto space-y-8">
                <Link href="/join" className="flex items-center text-gray-400 hover:text-white w-fit">
                    <FiArrowLeft className="mr-2" /> Change Committee Selection
                </Link>

                {success ? (
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass p-12 text-center rounded-3xl space-y-6"
                    >
                        <FiCheckCircle className="w-16 h-16 mx-auto text-green-400 animate-bounce" />
                        <h2 className="text-3xl font-extrabold">Application Submitted!</h2>
                        <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                            We have successfully received your volunteer registration. Our HR team will reach out via email details to coordinate next steps.
                        </p>
                        <Link href="/" className="inline-block bg-accent hover:bg-accent-dark text-black px-6 py-3 rounded-xl font-bold transition-all text-sm">
                            Return to Homepage
                        </Link>
                    </motion.div>
                ) : (
                    <div className="glass p-8 md:p-10 rounded-3xl border border-white/5 space-y-8">
                        <div>
                            <h2 className="text-2xl font-extrabold text-white">Join {cycle.name}</h2>
                            <p className="text-gray-400 text-xs mt-1">Please provide accurate detail and answer all questions.</p>
                        </div>

                        {errorMsg && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center">
                                <FiAlertCircle className="mr-2" /> {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Core Information Section */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-sm text-accent tracking-wider uppercase">1. Personal Information</h3>

                                <div className="space-y-1">
                                    <label className="text-xs text-gray-400 font-semibold uppercase">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. John Doe"
                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 font-semibold uppercase">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="e.g. name@domain.com"
                                            className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 font-semibold uppercase">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="e.g. +20 10..."
                                            className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 font-semibold uppercase">University</label>
                                        <input
                                            type="text"
                                            required
                                            value={university}
                                            onChange={(e) => setUniversity(e.target.value)}
                                            placeholder="e.g. Cairo University"
                                            className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400 font-semibold uppercase">Faculty / Major</label>
                                        <input
                                            type="text"
                                            required
                                            value={faculty}
                                            onChange={(e) => setFaculty(e.target.value)}
                                            placeholder="e.g. Computer Science"
                                            className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic questionnaire fields */}
                            {cycle.formFields?.length > 0 && (
                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <h3 className="font-bold text-sm text-accent tracking-wider uppercase">2. Committee Questions</h3>

                                    {cycle.formFields.map((field) => {
                                        const value = formData[field.id] || '';
                                        return (
                                            <div key={field.id} className="space-y-1">
                                                <label className="text-xs text-gray-300 font-bold block mb-1">
                                                    {field.label} {field.required && <span className="text-red-400">*</span>}
                                                </label>

                                                {field.type === 'textarea' ? (
                                                    <textarea
                                                        required={field.required}
                                                        rows={4}
                                                        value={value}
                                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                                        placeholder={field.placeholder || 'Answer here...'}
                                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm resize-none"
                                                    />
                                                ) : field.type === 'dropdown' ? (
                                                    <select
                                                        required={field.required}
                                                        value={value}
                                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none text-sm cursor-pointer"
                                                    >
                                                        <option value="">Select option...</option>
                                                        {field.options?.map((opt) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={['email', 'phone', 'date'].includes(field.type) ? field.type : 'text'}
                                                        required={field.required}
                                                        value={value}
                                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                                        placeholder={field.placeholder || 'Answer here...'}
                                                        className="w-full p-4 bg-dark-light border border-white/10 rounded-xl text-white outline-none focus:border-accent text-sm"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-accent hover:bg-accent-dark text-black p-4 rounded-xl font-bold flex items-center justify-center space-x-2 text-md transition-all pt-3.5 mt-8 shadow-[0_0_20px_rgba(0,255,136,0.1)]"
                            >
                                <span>Submit Form Registration</span> <FiSend />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
