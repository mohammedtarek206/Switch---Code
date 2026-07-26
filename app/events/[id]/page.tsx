'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiClock, FiUser, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar'; // Adjust this import based on the actual components path if it exists

export default function EventPublicPage() {
    const params = useParams();
    const eventId = params?.id as string;

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', university: '', faculty: '' });
    const [regSubmitting, setRegSubmitting] = useState(false);
    const [regMessage, setRegMessage] = useState<any>(null);

    useEffect(() => {
        if (eventId) fetchEvent();
    }, [eventId]);

    async function fetchEvent() {
        try {
            const res = await fetch(`/api/events/${eventId}`);
            if (!res.ok) {
                setError('Event not found or failed to load');
                return;
            }
            setEvent(await res.json());
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }

    async function handleRegisterSubmit(e: React.FormEvent) {
        e.preventDefault();
        setRegSubmitting(true);
        setRegMessage(null);

        try {
            const res = await fetch(`/api/events/${eventId}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regForm)
            });
            const resData = await res.json();

            if (res.ok) {
                setRegMessage({ type: 'success', text: resData.message });
                setRegForm({ name: '', email: '', phone: '', university: '', faculty: '' });
                fetchEvent(); // refresh seats
            } else {
                setRegMessage({ type: 'error', text: resData.error || 'Registration failed' });
            }
        } catch {
            setRegMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setRegSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-[#07111F] text-white flex flex-col items-center justify-center space-y-4">
                <FiXCircle className="w-16 h-16 text-red-500" />
                <h1 className="text-2xl font-black uppercase tracking-widest">{error || 'Not Found'}</h1>
                <Link href="/" className="btn-primary-blue px-6 py-2 rounded-xl text-xs">Return Home</Link>
            </div>
        );
    }

    const isClosed = !event.registrationOpen || (event.seatsLeft !== null && event.seatsLeft <= 0) || (event.registrationDeadline && new Date() > new Date(event.registrationDeadline));

    return (
        <div className="min-h-screen bg-[#07111F] text-white selection:bg-blue-600 pt-32 pb-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Event Header Banner */}
                <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] border border-blue-500/20 relative overflow-hidden bg-gradient-to-tr from-blue-900/20 via-slate-900/60 to-gold/5">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col space-y-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gold mb-2 block">Community Event Registration</span>
                            <h1 className="text-3xl md:text-5xl font-black leading-tight">{event.title}</h1>
                        </div>

                        <p className="text-slate-300 font-medium text-sm md:text-base leading-relaxed max-w-2xl">{event.description}</p>

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-blue-500/20 text-xs font-bold text-slate-300">
                            <div className="flex items-center bg-slate-900 px-4 py-2 rounded-xl border border-blue-500/30">
                                <FiCalendar className="mr-2 text-blue-500" /> {new Date(event.date).toLocaleDateString()}
                            </div>
                            {event.time && (
                                <div className="flex items-center bg-slate-900 px-4 py-2 rounded-xl border border-blue-500/30">
                                    <FiClock className="mr-2 text-blue-500" /> {event.time}
                                </div>
                            )}
                            <div className="flex items-center bg-slate-900 px-4 py-2 rounded-xl border border-blue-500/30">
                                <FiMapPin className="mr-2 text-blue-500" /> {event.location || 'Online'}
                            </div>
                            <div className="flex items-center bg-slate-900 px-4 py-2 rounded-xl border border-gold/30 text-gold">
                                <FiUser className="mr-2" /> Seats Left: {event.seatsLeft !== null ? event.seatsLeft : 'Unlimited'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration Form Panel */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 md:p-12 rounded-[2.5rem] border border-blue-500/30">
                    <h2 className="text-2xl font-black mb-6">Secure Your Spot</h2>

                    {regMessage && (
                        <div className={`mb-6 p-4 rounded-2xl text-sm font-bold border flex items-center gap-3 ${regMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                            {regMessage.type === 'success' ? <FiCheckCircle className="w-5 h-5 shrink-0" /> : <FiXCircle className="w-5 h-5 shrink-0" />}
                            {regMessage.text}
                        </div>
                    )}

                    {isClosed && regMessage?.type !== 'success' ? (
                        <div className="bg-red-500/10 text-red-400 border border-red-500/30 p-6 rounded-2xl text-center font-bold">
                            Registration for this event is currently closed or fully booked.
                        </div>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="space-y-5">
                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Full Name *</label>
                                    <input type="text" required value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} className="w-full bg-slate-900/50 border border-blue-500/30 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-gold transition-colors" placeholder="e.g. Ahmed Ali" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Email Address *</label>
                                    <input type="email" required value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} className="w-full bg-slate-900/50 border border-blue-500/30 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-gold transition-colors" placeholder="ahmed@example.com" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Phone Number</label>
                                <input type="tel" value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} className="w-full bg-slate-900/50 border border-blue-500/30 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-gold transition-colors" placeholder="01xxxxxxxxx" />
                            </div>

                            <div className="grid md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">University</label>
                                    <input type="text" value={regForm.university} onChange={e => setRegForm({ ...regForm, university: e.target.value })} className="w-full bg-slate-900/50 border border-blue-500/30 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-gold transition-colors" placeholder="e.g. Cairo University" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Faculty / Major</label>
                                    <input type="text" value={regForm.faculty} onChange={e => setRegForm({ ...regForm, faculty: e.target.value })} className="w-full bg-slate-900/50 border border-blue-500/30 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-gold transition-colors" placeholder="e.g. Computer Science" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={regSubmitting} className="btn-primary-blue w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 flex justify-center items-center">
                                    {regSubmitting ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                                    ) : null}
                                    {regSubmitting ? 'Processing...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
