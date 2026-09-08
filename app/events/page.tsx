'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiCalendar, FiClock, FiMapPin, FiUsers } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar'; // We'll keep Navbar

export default function EventsListPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/events');
                if (res.ok) {
                    setEvents(await res.json());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const now = new Date();

    // Sort logic depends on date and status
    const upcomingEvents = events.filter(e =>
        new Date(e.date) >= now ||
        e.status === 'upcoming' ||
        e.status === 'registration_open' ||
        e.status === 'ongoing'
    );
    const pastEvents = events.filter(e =>
        new Date(e.date) < now &&
        e.status !== 'upcoming' &&
        e.status !== 'registration_open' &&
        e.status !== 'ongoing'
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07111F] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const EventCard = ({ event, isPast }: { event: any, isPast: boolean }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel rounded-2xl border border-blue-500/20 overflow-hidden flex flex-col ${isPast ? 'opacity-80 grayscale-[20%]' : ''}`}
        >
            <div className="relative h-48 w-full bg-slate-800">
                {event.banner ? (
                    <img src={event.banner} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-blue-900 to-slate-900 flex items-center justify-center text-slate-500">
                        No Image Available
                    </div>
                )}
                <div className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold rounded-full border ${isPast ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                    {isPast ? 'Completed' : (event.registrationOpen ? 'Registration Open' : 'Registration Closed')}
                </div>
            </div>
            <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">{event.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-3 mb-4">{event.description}</p>
                </div>

                <div className="space-y-2 text-xs font-semibold text-slate-300 mt-auto pt-4 border-t border-blue-500/10">
                    <div className="flex items-center">
                        <FiCalendar className="mr-2 text-blue-500" /> {new Date(event.date).toLocaleDateString()}
                    </div>
                    {event.time && (
                        <div className="flex items-center">
                            <FiClock className="mr-2 text-blue-500" /> {event.time}
                        </div>
                    )}
                    <div className="flex items-center">
                        <FiMapPin className="mr-2 text-blue-500" /> {event.isOnline ? 'Online' : (event.location || 'TBA')}
                    </div>
                    {event.organizer && (
                        <div className="flex items-center">
                            <FiUsers className="mr-2 text-blue-500" /> Organizer: {event.organizer}
                        </div>
                    )}
                </div>

                <Link href={`/events/${event._id}`} className={`mt-6 block text-center py-3 rounded-xl font-bold transition-all text-sm uppercase tracking-wider ${isPast ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'btn-primary-blue'}`}>
                    View Details
                </Link>
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-[#07111F] text-white selection:bg-blue-600">
            <Navbar />
            <div className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto space-y-16">

                {/* Header */}
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-gold">
                        Events Platform
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base font-semibold leading-relaxed">
                        Discover and register for upcoming events, workshops, and meetups organized by our community.
                    </p>
                </div>

                {/* Upcoming Events */}
                <div>
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-black text-white">Upcoming Events</h2>
                        <div className="h-[1px] flex-grow bg-gradient-to-r from-blue-500/50 to-transparent"></div>
                    </div>

                    {upcomingEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingEvents.map(event => (
                                <EventCard key={event._id} event={event} isPast={false} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 glass-panel rounded-2xl border border-blue-500/20 text-slate-400">
                            No upcoming events at the moment. Stay tuned!
                        </div>
                    )}
                </div>

                {/* Past Events */}
                <div>
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-black text-white">Past Events</h2>
                        <div className="h-[1px] flex-grow bg-gradient-to-r from-slate-700 to-transparent"></div>
                    </div>

                    {pastEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pastEvents.map(event => (
                                <EventCard key={event._id} event={event} isPast={true} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 glass-panel rounded-2xl border border-slate-700/50 text-slate-500">
                            No past events available.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
