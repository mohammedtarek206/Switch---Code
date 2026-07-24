'use client';

import { motion } from 'framer-motion';
import { FiCode, FiShield, FiCpu } from 'react-icons/fi';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-dark via-dark-light to-dark pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 cyber-grid opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 animate-gradient"></div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-cyber bg-clip-text text-transparent"
          >
            the  Switch Code
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-8"
          >
            Empowering the Next Generation of Tech Leaders
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-gray-400 mb-12 max-w-2xl mx-auto"
          >
            Certified training in Programming, Cybersecurity, and Artificial Intelligence.
            Transform your passion into expertise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            <Link
              href="/tracks"
              className="px-8 py-4 bg-gradient-to-r from-primary to-accent rounded-full text-white font-semibold hover:scale-105 transition-transform shadow-lg shadow-primary/50"
            >
              Explore Tracks
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border-2 border-primary rounded-full text-primary font-semibold hover:bg-primary/10 transition-colors"
            >
              Get Started
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid md:grid-cols-3 gap-8 mt-16"
          >
            {[
              { icon: FiCode, title: 'Programming', desc: 'Master modern languages' },
              { icon: FiShield, title: 'Cybersecurity', desc: 'Protect digital assets' },
              { icon: FiCpu, title: 'AI & ML', desc: 'Build intelligent systems' },
            ].map((item, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-6 hover:scale-105 transition-transform"
              >
                <item.icon className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, repeat: Infinity, repeatType: 'reverse', duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-accent rounded-full flex justify-center">
          <div className="w-1 h-3 bg-accent rounded-full mt-2"></div>
        </div>
      </motion.div>
    </section>
  );
}
