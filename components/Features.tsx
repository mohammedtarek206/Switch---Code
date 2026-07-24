'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiCode, FiShield, FiCpu, FiDatabase, FiCloud, FiSmartphone } from 'react-icons/fi';

export default function Features() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  const features = [
    {
      icon: FiCode,
      title: 'Web Development',
      desc: 'Full-stack development with modern frameworks',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: FiShield,
      title: 'Cybersecurity',
      desc: 'Ethical hacking and security protocols',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: FiCpu,
      title: 'Artificial Intelligence',
      desc: 'Machine learning and AI fundamentals',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: FiDatabase,
      title: 'Data Science',
      desc: 'Data analysis and visualization',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: FiCloud,
      title: 'Cloud Computing',
      desc: 'AWS, Azure, and DevOps practices',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: FiSmartphone,
      title: 'Mobile Development',
      desc: 'React Native and Flutter apps',
      color: 'from-pink-500 to-pink-600',
    },
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-dark via-dark-light to-dark" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Training <span className="text-accent">Tracks</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Choose from our diverse range of specialized tech tracks
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="glass rounded-2xl p-8 h-full hover:scale-105 transition-transform cursor-pointer">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-300">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
