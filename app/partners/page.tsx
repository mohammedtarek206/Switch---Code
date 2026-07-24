'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/partners')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPartners(data);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-4">
      <div className="container mx-auto max-w-6xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-black tracking-tighter mb-6 uppercase"
        >
          TRUSTED BY <span className="text-primary italic">BEST OPERATORS</span>
        </motion.h1>
        <p className="text-gray-500 max-w-2xl mx-auto mb-20 font-medium leading-relaxed">
          We collaborate with industry leaders and educational institutions to provide our students with premium opportunities and real-world experience.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 items-center">
          {partners.map((partner, i) => (
            <motion.div
              key={partner._id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 hover:border-primary/50 transition-all group"
            >
              <img
                src={partner.logoUrl}
                alt={partner.name}
                className="w-full aspect-square object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500 scale-90 group-hover:scale-100"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
