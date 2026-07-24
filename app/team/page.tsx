'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiLinkedin, FiTwitter, FiGithub, FiMail } from 'react-icons/fi';
import { formatGoogleDriveImageUrl } from '@/lib/googleDrive';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchTeam();
  }, []);

  async function fetchTeam() {
    try {
      const [pubRes, userRes] = await Promise.all([
        fetch('/api/community/public-team'),
        fetch('/api/team')
      ]);

      let allMembers: any[] = [];

      if (pubRes.ok) {
        const publicShowcase = await pubRes.json();
        allMembers = [...allMembers, ...publicShowcase];
      }

      if (userRes.ok) {
        const data = await userRes.json();
        if (data.members && data.members.length > 0) {
          const formattedUsers = data.members.map((m: any) => ({
            _id: m._id,
            name: m.name,
            role: m.position || m.role,
            category: m.role === 'president' || m.role === 'super_admin' ? 'leadership' : 'other',
            bio: m.bio || m.notes,
            avatar: m.avatar,
            committee: m.committeeId?.name,
            team: m.teamId?.name,
            socials: m.social || { email: m.email },
            committeeId: m.committeeId,
          }));
          allMembers = [...allMembers, ...formattedUsers];
        }
      }

      // Deduplicate by name just in case
      const unique = Array.from(new Map(allMembers.map(m => [m.name?.toLowerCase(), m])).values());
      setMembers(unique);
    } catch (err) {
      console.error('Failed to load dynamic team members:', err);
    } fontally: {
      setLoading(false);
    }
  }

  const categories = [
    { id: 'all', name: 'All Members' },
    { id: 'leadership', name: 'Leadership & Board' },
    { id: 'technical', name: 'Technical & Eng' },
    { id: 'hr', name: 'HR & People' },
    { id: 'media', name: 'Media & Design' },
    { id: 'pr', name: 'PR & Marketing' },
  ];

  const filteredMembers = members.filter(m => {
    if (filterRole === 'all') return true;
    const cat = (m.category || '').toLowerCase();
    const r = (m.role || '').toLowerCase();
    const commName = (m.committee || m.committeeId?.name || '').toLowerCase();

    if (filterRole === 'leadership') return cat === 'leadership' || ['super_admin', 'admin', 'president', 'vice_president', 'committee_leader', 'ceo', 'founder'].some(x => r.includes(x));
    if (filterRole === 'technical') return cat === 'technical' || commName.includes('tech') || r.includes('tech') || r.includes('developer');
    if (filterRole === 'hr') return cat === 'hr' || commName.includes('hr') || r.includes('hr');
    if (filterRole === 'media') return cat === 'media' || commName.includes('media') || r.includes('media') || r.includes('design');
    if (filterRole === 'pr') return cat === 'pr' || commName.includes('pr') || r.includes('pr') || r.includes('marketing');
    return true;
  });

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-dark via-dark-light to-dark text-white pb-20">
      <div className="container mx-auto px-4 py-12 space-y-12">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <span className="text-xs font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent inline-block">
            Our Organization
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-primary via-accent to-cyber bg-clip-text text-transparent">
            Meet Our Team
          </h1>
          <p className="text-gray-300 text-base md:text-lg">
            Meet the passionate educators, executives, and industry experts who are dedicated to your success.
          </p>
        </motion.div>

        {/* Filter Bar */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterRole(cat.id)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${filterRole === cat.id
                ? 'bg-accent text-black shadow-[0_0_20px_rgba(0,255,136,0.3)]'
                : 'glass text-gray-400 hover:text-white border border-white/5'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="text-center py-20 text-accent font-bold">Syncing dynamic team showcase...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="glass p-12 text-center text-gray-500 rounded-3xl max-w-md mx-auto border border-white/5">
            No team members listed in this category yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMembers.map((member, index) => {
              const avatarUrl = formatGoogleDriveImageUrl(member.avatar);
              const roleDisplay = (member.role || 'Member').replace(/_/g, ' ');
              const committeeName = member.committee || member.committeeId?.name;
              const teamName = member.team;
              const socials = member.socials || member.social || {};

              return (
                <motion.div
                  key={member._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-3xl p-6 border border-white/5 hover:border-accent/30 hover:scale-[1.02] transition-all flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="space-y-4 text-center">
                    {/* Photo with Google Drive support */}
                    <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-primary to-accent p-1 overflow-hidden shadow-xl group-hover:scale-105 transition-transform">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={member.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-dark-light flex items-center justify-center font-extrabold text-3xl text-accent">
                          {member.name ? member.name[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-lg font-extrabold text-white group-hover:text-accent transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-xs font-bold text-accent capitalize mt-0.5">
                        {roleDisplay}
                      </p>

                      {(committeeName || teamName) && (
                        <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                          {committeeName && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-primary">
                              {committeeName}
                            </span>
                          )}
                          {teamName && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent">
                              {teamName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-gray-400 text-xs line-clamp-3">
                      {member.bio || 'Dedicated team member.'}
                    </p>
                  </div>

                  {/* Social links */}
                  <div className="flex justify-center space-x-3 pt-4 border-t border-white/5 mt-4">
                    {socials.linkedin && (
                      <a href={socials.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-accent transition-colors">
                        <FiLinkedin className="w-4 h-4" />
                      </a>
                    )}
                    {socials.github && (
                      <a href={socials.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-accent transition-colors">
                        <FiGithub className="w-4 h-4" />
                      </a>
                    )}
                    {socials.twitter && (
                      <a href={socials.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-accent transition-colors">
                        <FiTwitter className="w-4 h-4" />
                      </a>
                    )}
                    {socials.email && (
                      <a href={`mailto:${socials.email}`} className="text-gray-400 hover:text-accent transition-colors">
                        <FiMail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
