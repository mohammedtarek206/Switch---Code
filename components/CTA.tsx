'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiArrowRight, FiMail } from 'react-icons/fi';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary via-cyber to-accent relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Tech Journey?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of students who are already building their future with Switch Code
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-white text-primary rounded-full font-semibold hover:scale-105 transition-transform shadow-lg"
            >
              Get Started <FiArrowRight className="ml-2" />
            </Link>
            <Link
              href="mailto:info@switchcode.tech"
              className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
            >
              <FiMail className="mr-2" />
              Contact Us
            </Link>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </section>
  );
}
