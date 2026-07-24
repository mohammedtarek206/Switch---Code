'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiSend } from 'react-icons/fi';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-dark via-dark-light to-dark">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-cyber bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Get in Touch</h2>
              <p className="text-gray-300 mb-8">
                We're here to help you start your journey in tech. Reach out to us via any of these channels.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <FiMail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Email</h3>
                  <p className="text-gray-400">info@switchcode.tech</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-cyber rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <FiPhone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Phone</h3>
                  <p className="text-gray-400">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-gradient-to-br from-cyber to-primary rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <FiMapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Address</h3>
                  <p className="text-gray-400">Global (Online Platform)</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="glass rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">Send Message</h2>
              
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiSend className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-300">We'll get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-white mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-dark/50 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="Your Name"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-dark/50 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-dark/50 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2">Message</label>
                    <textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3 bg-dark/50 border border-primary/20 rounded-lg text-white focus:outline-none focus:border-primary transition-colors resize-none"
                      placeholder="Your message..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-primary to-accent rounded-lg text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
