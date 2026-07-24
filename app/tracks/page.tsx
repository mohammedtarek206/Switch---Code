'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiCode, FiShield, FiCpu, FiDatabase, FiCloud, FiSmartphone, FiCheck } from 'react-icons/fi';

interface Track {
  _id: string;
  title: string;
  description: string;
  icon: string;
  level: string;
  duration: string;
  curriculum: string[];
}

const iconMap: Record<string, any> = {
  FiCode: FiCode,
  FiShield: FiShield,
  FiCpu: FiCpu,
  FiDatabase: FiDatabase,
  FiCloud: FiCloud,
  FiSmartphone: FiSmartphone,
};

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch('/api/tracks');
        const data = await res.json();
        if (Array.isArray(data)) {
          setTracks(data);
        }
      } catch (err) {
        console.error('Failed to fetch tracks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-dark via-dark-light to-dark">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-primary via-accent to-cyber bg-clip-text text-transparent tracking-tighter uppercase">
            Learning Tracks
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto font-medium">
            Choose your path to tech excellence. Each track is industry-aligned and project-based.
          </p>
        </motion.div>

        {/* Tracks Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {tracks.map((track, index) => {
            const IconComponent = iconMap[track.icon] || FiCode;
            return (
              <motion.div
                key={track._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-3xl p-8 hover:border-primary/50 transition-all group border border-white/5"
              >
                <div className="flex items-start mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">{track.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20">
                        {track.duration}
                      </span>
                      <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold border border-accent/20">
                        {track.level}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-400 mb-6 line-clamp-2">{track.description}</p>

                <h4 className="font-bold text-gray-200 mb-4 text-sm uppercase tracking-wider">What you&apos;ll learn:</h4>
                <ul className="space-y-3 mb-8">
                  {(track.curriculum || []).slice(0, 4).map((item, idx) => (
                    <li key={idx} className="flex items-start text-gray-400 text-sm">
                      <FiCheck className="w-4 h-4 text-accent mr-3 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/tracks/${track._id}`}
                  className="w-full inline-block text-center py-4 bg-white/5 hover:bg-primary text-white font-bold rounded-2xl transition-all border border-white/10 hover:border-primary active:scale-95"
                >
                  START LEARNING
                </Link>
              </motion.div>
            );
          })}
        </div>

        {tracks.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-2xl text-gray-500 font-bold">No tracks available yet. Please check back later.</h2>
          </div>
        )}
      </div>
    </div>
  );
}
