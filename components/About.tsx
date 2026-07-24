'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiTarget, FiUsers, FiAward, FiTrendingUp } from 'react-icons/fi';

export default function About() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  const stats = [
    { icon: FiUsers, value: '500+', label: 'Students Trained' },
    { icon: FiAward, value: '100%', label: 'Certification Rate' },
    { icon: FiTrendingUp, value: '90%', label: 'Job Placement' },
    { icon: FiTarget, value: '5+', label: 'Training Tracks' },
  ];

  return (
    <section id="about" className="py-20 bg-white dark:bg-dark-light" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            About <span className="text-primary">Switch Code</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A bilingual tech education initiative dedicated to empowering youth through 
            world-class training in cutting-edge technologies.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-3xl font-bold mb-4">Our Mission</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              To bridge the gap between talent and opportunity by providing accessible, 
              high-quality tech education that prepares students for real-world challenges.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              We believe that every passionate learner deserves access to world-class 
              training, mentorship, and career support.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-4"
          >
            {[
              { title: 'Hands-On Learning', desc: 'Project-based curriculum with real-world applications' },
              { title: 'Expert Mentors', desc: 'Learn from industry professionals and certified instructors' },
              { title: 'Career Support', desc: 'Job placement assistance and career guidance' },
              { title: 'Certified Programs', desc: 'Recognized certifications that boost your resume' },
            ].map((item, index) => (
              <div key={index} className="glass rounded-lg p-4">
                <h4 className="font-semibold text-primary mb-2">{item.title}</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid md:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 glass rounded-2xl hover:scale-105 transition-transform"
            >
              <stat.icon className="w-12 h-12 text-accent mx-auto mb-4" />
              <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
