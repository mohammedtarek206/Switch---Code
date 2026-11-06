'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiExternalLink, FiArrowLeft, FiStar, FiPackage } from 'react-icons/fi';

interface Partner {
  _id: string;
  name: string;
  logo: string;
  description?: string;
  websiteUrl?: string;
  partnershipType?: string;
  isFeatured: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
}

function PartnerCard({ partner, featured = false }: { partner: Partner; featured?: boolean }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className={`glass-card rounded-3xl border border-blue-500/20 hover:border-gold/40 transition-all duration-300 flex flex-col ${featured ? 'p-8' : 'p-6'}`}
    >
      {/* Logo */}
      <div className={`bg-white/5 rounded-2xl border border-blue-500/20 flex items-center justify-center mx-auto overflow-hidden ${featured ? 'w-36 h-36 mb-6' : 'w-24 h-24 mb-4'}`}>
        {!imgErr && partner.logo ? (
          <img
            src={partner.logo}
            alt={partner.name}
            className="w-full h-full object-contain p-3"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="text-slate-600 flex items-center justify-center w-full h-full">
            <FiPackage className={featured ? 'w-12 h-12' : 'w-8 h-8'} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 text-center space-y-2">
        {partner.partnershipType && (
          <span className="inline-block px-3 py-1 bg-blue-900/50 text-blue-300 text-[10px] font-black rounded-full border border-blue-500/20 uppercase tracking-wider">
            {partner.partnershipType}
          </span>
        )}
        {partner.isFeatured && featured && (
          <div className="flex items-center justify-center gap-1 mb-1">
            <FiStar className="w-3.5 h-3.5 text-gold fill-gold" />
            <span className="text-gold text-[10px] font-black uppercase tracking-wider">Featured Partner</span>
          </div>
        )}
        <h3 className={`font-black text-white leading-snug ${featured ? 'text-2xl' : 'text-lg'}`}>{partner.name}</h3>
        {partner.description && (
          <p className={`text-slate-400 leading-relaxed ${featured ? 'text-sm' : 'text-xs line-clamp-2'}`}>{partner.description}</p>
        )}
      </div>

      {/* Website */}
      {partner.websiteUrl && (
        <div className="mt-4 pt-4 border-t border-blue-500/10">
          <a
            href={partner.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary-navy w-full flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase tracking-wider rounded-2xl"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            Visit Website
          </a>
        </div>
      )}
    </motion.div>
  );
}

export default function PartnersPage() {
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/partners')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllPartners(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const featured = allPartners.filter(p => p.isFeatured);
  const regular = allPartners.filter(p => !p.isFeatured);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111F] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111F] text-white overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-36 pb-24 px-4 md:px-8 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-blue-600/20 via-blue-900/10 to-transparent blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-gold/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider mb-8 transition-colors">
              <FiArrowLeft className="w-4 h-4" /> Back to Home
            </Link>

            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-blue-500/30 text-gold text-xs font-black uppercase tracking-widest backdrop-blur-md mb-6 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
              Our Partners
            </span>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white mb-6">
              Our{' '}
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-gold bg-clip-text text-transparent">
                Partners
              </span>
            </h1>

            <p className="text-xl font-bold text-gold mb-4">Together, We Create More Impact.</p>

            <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Discover the organizations and communities that support our mission to empower the next generation of technology leaders.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Empty State */}
      {allPartners.length === 0 && (
        <section className="py-20 px-4 max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-16 rounded-3xl border border-blue-500/20 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <FiPackage className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Partnerships Coming Soon</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              We are actively building partnerships with organizations, universities, and companies. Stay tuned for exciting announcements!
            </p>
          </motion.div>
        </section>
      )}

      {/* Featured Partners */}
      {featured.length > 0 && (
        <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto space-y-10">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 text-xs font-black text-gold uppercase tracking-widest mb-2">
              <FiStar className="w-4 h-4 fill-gold" /> Featured Partners
            </span>
            <h2 className="text-3xl font-black text-white">Our Key Partners</h2>
            <p className="text-slate-400 text-sm mt-2">Organizations at the core of our mission</p>
          </div>

          <div className={`grid gap-6 ${featured.length === 1 ? 'max-w-sm mx-auto' : featured.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
            {featured.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <PartnerCard partner={p} featured />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* All Partners */}
      {regular.length > 0 && (
        <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto space-y-10">
          {featured.length > 0 && (
            <div className="border-t border-blue-500/20" />
          )}
          <div className="text-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">🤝 All Partners</span>
            <h2 className="text-3xl font-black text-white">
              {featured.length > 0 ? 'More Partners' : 'Our Partners'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {regular.map((p, i) => (
              <motion.div key={p._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}>
                <PartnerCard partner={p} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      {allPartners.length > 0 && (
        <section className="py-20 px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="glass-panel p-12 rounded-[2.5rem] border border-blue-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-gold/5 pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <span className="text-xs font-black text-gold uppercase tracking-widest">Become a Partner</span>
                <h2 className="text-3xl font-black text-white">Want to Collaborate With Us?</h2>
                <p className="text-slate-300 text-base leading-relaxed max-w-lg mx-auto">
                  Join our growing network of partners and help us build the future of technology education.
                </p>
                <Link href="/contact" className="btn-primary-blue inline-flex items-center gap-2 px-8 py-3.5 text-xs font-black uppercase tracking-wider mt-4">
                  Get in Touch <FiExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}
