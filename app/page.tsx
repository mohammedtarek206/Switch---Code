'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  FiArrowRight, FiUsers, FiCalendar, FiAward, FiCheckSquare,
  FiBookOpen, FiBriefcase, FiGrid, FiClock, FiMapPin, FiUserCheck,
  FiStar, FiChevronRight, FiX, FiCheckCircle, FiShield, FiTrendingUp,
  FiCode, FiCpu, FiLayers, FiTerminal, FiGlobe, FiRadio
} from 'react-icons/fi';
import { FaPython, FaReact, FaHtml5, FaCss3Alt, FaJsSquare, FaRobot, FaLock } from 'react-icons/fa';

export default function DynamicHomepage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registerModalEvent, setRegisterModalEvent] = useState<any>(null);
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', university: '', faculty: '' });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regMessage, setRegMessage] = useState<any>(null);

  useEffect(() => {
    fetchHomepageData();
  }, []);

  async function fetchHomepageData() {
    // Safety timeout: Never keep the user waiting on spinner for more than 1.2 seconds
    const timeoutTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    try {
      const res = await fetch('/api/homepage');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch homepage data', err);
    } finally {
      clearTimeout(timeoutTimer);
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!registerModalEvent) return;
    setRegSubmitting(true);
    setRegMessage(null);

    try {
      const res = await fetch(`/api/events/${registerModalEvent._id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const resData = await res.json();

      if (res.ok) {
        setRegMessage({ type: 'success', text: resData.message });
        setRegForm({ name: '', email: '', phone: '', university: '', faculty: '' });
        fetchHomepageData();
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
      <div className="min-h-screen bg-[#07111F] text-blue-500 flex items-center justify-center font-bold">
        <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { config, stats, upcomingEvents, pastEvents, activeRecruitment, highlights, news, committees, partners, projects } = data || {};
  const vis = config?.sectionsVisibility || {};
  const order = config?.sectionOrder || ['hero', 'stats', 'activeRecruitment', 'upcomingEvents', 'highlights', 'featuredCommittees', 'announcements', 'pastEvents'];

  function getCountdown(targetDate: string) {
    if (!targetDate) return null;
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
  }

  return (
    <div className="min-h-screen bg-[#07111F] text-white selection:bg-blue-600 selection:text-white overflow-x-hidden pt-20">

      {/* Floating Animated Tech Icons in Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-36 left-[8%] text-blue-500/20 text-5xl">
          <FaPython />
        </motion.div>
        <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-48 right-[10%] text-blue-400/20 text-6xl">
          <FaReact />
        </motion.div>
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-[600px] left-[5%] text-gold/20 text-5xl">
          <FaJsSquare />
        </motion.div>
        <motion.div animate={{ y: [0, 18, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-[800px] right-[7%] text-blue-600/20 text-6xl">
          <FaRobot />
        </motion.div>
        <motion.div animate={{ y: [0, -25, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-[1200px] left-[12%] text-gold/15 text-5xl">
          <FaLock />
        </motion.div>
      </div>

      {/* Render sections dynamically by sectionOrder */}
      {order.map((secKey: string) => {
        if (vis[secKey] === false) return null;

        // 1. HERO SECTION
        if (secKey === 'hero') {
          return (
            <section key="hero" className="relative pt-24 pb-24 px-4 md:px-8 overflow-hidden z-10">
              {/* Radial Glows */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-600/25 via-blue-800/10 to-gold/10 blur-[150px] rounded-full pointer-events-none" />

              <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-blue-500/30 text-gold text-xs font-black uppercase tracking-widest backdrop-blur-md mb-6 shadow-lg shadow-blue-900/20">
                    <span className="w-2.5 h-2.5 rounded-full bg-gold animate-ping" />
                    Switch Code Official Platform
                  </span>
                  <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-none text-white max-w-4xl mx-auto">
                    {config?.hero?.title || 'Building The Future Of Tech Leaders'}
                  </h1>
                  <p className="text-slate-300 text-base md:text-xl max-w-3xl mx-auto font-medium mt-6 leading-relaxed">
                    {config?.hero?.subtitle || 'Empowering software engineers, developers, and creators through hands-on practice, specialized committees, and real-world projects.'}
                  </p>
                </motion.div>

                <div className="flex flex-wrap items-center justify-center gap-5 pt-4">
                  <Link href={config?.hero?.ctaPrimaryLink || '/community/committees'} className="btn-primary-blue px-8 py-4 text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-blue-600/30">
                    {config?.hero?.ctaPrimaryText || 'Explore Committees'} <FiArrowRight />
                  </Link>
                  <Link href={config?.hero?.ctaSecondaryLink || '/join'} className="btn-secondary-navy px-8 py-4 text-xs uppercase tracking-wider flex items-center gap-2">
                    {config?.hero?.ctaSecondaryText || 'Join Community'}
                  </Link>
                </div>
              </div>
            </section>
          );
        }

        // 2. ANIMATED STATISTICS
        if (secKey === 'stats') {
          return (
            <section key="stats" className="py-16 px-4 md:px-8 border-y border-blue-500/20 bg-[#0B1220]/60 backdrop-blur-md z-10 relative">
              <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                {[
                  { label: 'Active Members', value: `${stats?.membersCount || 250}+`, icon: FiUsers, color: 'text-blue-400' },
                  { label: 'Specialized Committees', value: stats?.committeesCount || 8, icon: FiGrid, color: 'text-gold' },
                  { label: 'Organized Events', value: stats?.eventsCount || 24, icon: FiCalendar, color: 'text-blue-400' },
                  { label: 'Trainees & Learners', value: `${stats?.traineesCount || 1500}+`, icon: FiBookOpen, color: 'text-gold' },
                ].map((s, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} className="glass-card p-6 rounded-3xl space-y-2">
                    <s.icon className={`w-7 h-7 mx-auto ${s.color}`} />
                    <span className={`text-4xl font-black block ${s.color}`}>{s.value}</span>
                    <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">{s.label}</span>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        }

        // 3. RECRUITMENT ANNOUNCEMENT BANNER
        if (secKey === 'activeRecruitment' && activeRecruitment) {
          const isOpen = activeRecruitment.isOpen !== false;
          const countdown = getCountdown(activeRecruitment.endDate);
          return (
            <section key="activeRecruitment" className="py-16 px-4 md:px-8 max-w-6xl mx-auto z-10 relative">
              <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] border border-blue-500/30 relative overflow-hidden bg-gradient-to-r from-blue-900/30 via-slate-900/60 to-blue-900/30">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-3xl rounded-full pointer-events-none" />

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                  <div className="space-y-4 max-w-2xl">
                    <span className="px-4 py-1.5 rounded-full bg-gold text-black font-black text-xs uppercase tracking-widest inline-block shadow-md shadow-gold/20">
                      🚀 Join Our Community - Recruitment Open
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-white">{activeRecruitment.title}</h2>
                    <p className="text-slate-300 text-sm md:text-base leading-relaxed">{activeRecruitment.description}</p>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {activeRecruitment.committees?.map((c: string, idx: number) => (
                        <span key={idx} className="bg-blue-950/80 text-blue-300 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-blue-500/30">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-3xl text-center space-y-4 shrink-0 min-w-[250px]">
                    {countdown && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Deadline Countdown</span>
                        <span className="text-xl font-black text-gold">{countdown}</span>
                      </div>
                    )}
                    <Link
                      href={isOpen ? '/join' : '#'}
                      className={`block w-full text-center font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-widest transition-all ${isOpen ? 'btn-primary-blue' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                    >
                      {isOpen ? 'Apply Now' : 'Applications Closed'}
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // 4. UPCOMING EVENTS SHOWCASE
        if (secKey === 'upcomingEvents') {
          return (
            <section key="upcomingEvents" className="py-16 px-4 md:px-8 max-w-6xl mx-auto space-y-8 z-10 relative">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-xs uppercase font-black text-gold tracking-widest block mb-1">🔥 Upcoming Events</span>
                  <h2 className="text-3xl font-black text-white">Live Community Sessions & Workshops</h2>
                </div>
              </div>

              {!upcomingEvents || upcomingEvents.length === 0 ? (
                <div className="glass-card p-12 rounded-3xl text-center text-slate-400">
                  No upcoming events scheduled right now. Check back soon!
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((ev: any) => {
                    const isClosed = !ev.registrationOpen || ev.seatsLeft <= 0 || (ev.registrationDeadline && new Date() > new Date(ev.registrationDeadline));
                    const countdown = getCountdown(ev.date);

                    return (
                      <div key={ev._id} className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between group">
                        {ev.banner && (
                          <div className="h-44 rounded-2xl overflow-hidden bg-slate-900 border border-blue-500/20 relative">
                            <img src={ev.banner} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            {countdown && (
                              <span className="absolute top-3 right-3 bg-[#07111F]/90 backdrop-blur-md text-gold text-[10px] font-black px-3 py-1 rounded-full border border-gold/30">
                                ⏳ {countdown}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                            <span>📅 {new Date(ev.date).toLocaleDateString()}</span>
                            <span className="text-blue-400">🎟️ {ev.seatsLeft} seats left</span>
                          </div>

                          <h3 className="text-xl font-black text-white leading-snug group-hover:text-gold transition-colors">{ev.title}</h3>
                          <p className="text-slate-400 text-xs line-clamp-2">{ev.description}</p>

                          <div className="pt-2 text-xs text-slate-300 space-y-1">
                            {ev.speakerName && <p>🎤 Speaker: <strong className="text-white">{ev.speakerName}</strong></p>}
                            {ev.organizer && <p>🏢 Organizer: <strong className="text-white">{ev.organizer}</strong></p>}
                            {ev.location && <p>📍 Location: <strong className="text-white">{ev.location}</strong></p>}
                          </div>
                        </div>

                        <button
                          disabled={isClosed}
                          onClick={() => setRegisterModalEvent(ev)}
                          className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${isClosed ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800' : 'btn-primary-blue'
                            }`}
                        >
                          {isClosed ? 'Registration Closed' : 'Register Now'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        }

        // 5. HIGHLIGHTS / HALL OF FAME (Rank #1 Golden Crown)
        if (secKey === 'highlights' && highlights) {
          const items = [
            { label: '🏆 Member Of The Month', data: highlights.memberOfTheMonth, rank: 1 },
            { label: '🏆 Best Committee Leader', data: highlights.bestLeader, rank: 2 },
            { label: '🏆 Best Vice Leader', data: highlights.bestViceLeader, rank: 3 },
            { label: '🏆 Best Volunteer', data: highlights.bestVolunteer, rank: 4 },
          ].filter(i => i.data);

          if (!items.length) return null;

          return (
            <section key="highlights" className="py-16 px-4 md:px-8 max-w-6xl mx-auto space-y-8 z-10 relative">
              <div>
                <span className="text-xs uppercase font-black text-gold tracking-widest block mb-1">🌟 Hall of Fame Highlights</span>
                <h2 className="text-3xl font-black text-white">Community Outstanding Achievers</h2>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item, idx) => (
                  <div key={idx} className={`glass-card p-6 rounded-3xl text-center space-y-4 relative overflow-hidden ${item.rank === 1 ? 'border-gold/50 shadow-gold/20' : ''}`}>
                    {item.rank === 1 && (
                      <div className="absolute top-2 right-3 text-gold text-2xl font-bold animate-bounce" title="Rank #1 Leaderboard">
                        👑
                      </div>
                    )}
                    <div className="w-20 h-20 rounded-full bg-blue-900/30 border-2 border-gold/40 mx-auto flex items-center justify-center font-black text-gold text-2xl overflow-hidden shadow-lg shadow-gold/10">
                      {item.data.avatar ? <img src={item.data.avatar} className="w-full h-full object-cover" /> : item.data.name[0]}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-gold bg-gold/10 border border-gold/30 px-2.5 py-1 rounded-full">{item.label}</span>
                      <h3 className="text-lg font-black text-white mt-2">{item.data.name}</h3>
                      <p className="text-slate-400 text-xs font-medium">{item.data.position || item.data.role}</p>
                      <span className="text-xs font-black text-gold block mt-2">⭐ {item.data.performanceScore || 100} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 6. FEATURED COMMITTEES
        if (secKey === 'featuredCommittees') {
          return (
            <section key="featuredCommittees" className="py-16 px-4 md:px-8 max-w-6xl mx-auto space-y-8 z-10 relative">
              <div>
                <span className="text-xs uppercase font-black text-gold tracking-widest block mb-1">🏢 Specialized Teams</span>
                <h2 className="text-3xl font-black text-white">Featured Committees</h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {committees?.map((c: any) => (
                  <div key={c._id} className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between group">
                    <div>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-950 text-gold border border-blue-500/30 inline-block mb-3">
                        {c.type || 'Committee'}
                      </span>
                      <h3 className="text-2xl font-black text-white group-hover:text-gold transition-colors">{c.name}</h3>
                      <p className="text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">{c.description || 'Specialized committee focused on technical growth and project execution.'}</p>
                    </div>

                    <div className="pt-4 border-t border-blue-500/20 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-bold">Leader: <strong className="text-white">{c.leaderId?.name || 'Assigned'}</strong></span>
                      <Link href={`/community/committees/${c._id}`} className="text-gold text-xs font-black hover:underline flex items-center gap-1">
                        View <FiChevronRight />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 7. LATEST NEWS & ANNOUNCEMENTS
        if (secKey === 'announcements') {
          return (
            <section key="announcements" className="py-16 px-4 md:px-8 max-w-6xl mx-auto space-y-8 z-10 relative">
              <div>
                <span className="text-xs uppercase font-black text-gold tracking-widest block mb-1">📰 News & Announcements</span>
                <h2 className="text-3xl font-black text-white">Latest Community Updates</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {news?.map((n: any) => (
                  <div key={n._id} className="glass-card p-6 rounded-3xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-gold bg-blue-950 border border-blue-500/30 px-2.5 py-1 rounded-full">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                      <h3 className="text-lg font-black text-white leading-snug">{n.title}</h3>
                      <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed">{n.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        // 8. PAST EVENTS ARCHIVE
        if (secKey === 'pastEvents' && pastEvents && pastEvents.length > 0) {
          return (
            <section key="pastEvents" className="py-16 px-4 md:px-8 max-w-6xl mx-auto space-y-8 opacity-80 z-10 relative">
              <div>
                <span className="text-xs uppercase font-black text-slate-400 tracking-widest block mb-1">📜 Archive</span>
                <h2 className="text-2xl font-black text-slate-300">Past Events</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {pastEvents.map((ev: any) => (
                  <div key={ev._id} className="glass-card p-6 rounded-3xl space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold">Concluded on {new Date(ev.date).toLocaleDateString()}</span>
                    <h3 className="text-base font-black text-white">{ev.title}</h3>
                    <p className="text-slate-400 text-xs line-clamp-2">{ev.description}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }

        return null;
      })}

      {/* Instant Event Registration Modal */}
      <AnimatePresence>
        {registerModalEvent && (
          <div className="fixed inset-0 z-50 bg-[#07111F]/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel p-8 rounded-3xl border border-blue-500/30 max-w-md w-full relative space-y-6">
              <button onClick={() => { setRegisterModalEvent(null); setRegMessage(null); }} className="absolute top-6 right-6 text-slate-400 hover:text-white">
                <FiX className="w-6 h-6" />
              </button>

              <div>
                <span className="text-xs uppercase font-black text-gold">Event Registration</span>
                <h3 className="text-2xl font-black text-white mt-1">{registerModalEvent.title}</h3>
              </div>

              {regMessage && (
                <div className={`p-4 rounded-2xl text-xs font-bold border ${regMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                  {regMessage.text}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-300 uppercase block mb-1">Full Name</label>
                  <input type="text" required value={regForm.name} onChange={e => setRegForm({ ...regForm, name: e.target.value })} className="w-full bg-slate-900 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold" placeholder="Mohammed Tarek" />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-300 uppercase block mb-1">Email Address</label>
                  <input type="email" required value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} className="w-full bg-slate-900 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold" placeholder="user@example.com" />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-300 uppercase block mb-1">Phone Number</label>
                  <input type="tel" value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} className="w-full bg-slate-900 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold" placeholder="01012345678" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-slate-300 uppercase block mb-1">University</label>
                    <input type="text" value={regForm.university} onChange={e => setRegForm({ ...regForm, university: e.target.value })} className="w-full bg-slate-900 border border-blue-500/30 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold" placeholder="Cairo Univ" />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-300 uppercase block mb-1">Faculty</label>
                    <input type="text" value={regForm.faculty} onChange={e => setRegForm({ ...regForm, faculty: e.target.value })} className="w-full bg-slate-900 border border-blue-500/30 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-gold" placeholder="CS / Eng" />
                  </div>
                </div>

                <button type="submit" disabled={regSubmitting} className="btn-primary-blue w-full py-4 text-xs uppercase tracking-widest disabled:opacity-50 mt-2">
                  {regSubmitting ? 'Submitting...' : 'Confirm Registration'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
