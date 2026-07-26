import Link from 'next/link';
import { FiMail, FiPhone, FiMapPin, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-[#07111F] border-t border-blue-500/20 text-slate-300 relative overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-48 bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 py-16 relative z-10">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl border border-blue-400/30 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-gold font-black text-xl">SC</span>
              </div>
              <span className="text-2xl font-black text-white tracking-tight">Switch Code</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Empowering the next generation of tech leaders through hands-on education, real-world projects, and specialized committees.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-extrabold text-white uppercase text-xs tracking-widest mb-4 text-gold">Quick Navigation</h3>
            <ul className="space-y-2.5 text-slate-400 text-sm font-medium">
              <li><Link href="/" className="hover:text-gold transition-colors">Home</Link></li>
              <li><Link href="/tracks" className="hover:text-gold transition-colors">Tracks</Link></li>
              <li><Link href="/team" className="hover:text-gold transition-colors">Team & Committees</Link></li>
              <li><Link href="/projects" className="hover:text-gold transition-colors">Projects Showcase</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-extrabold text-white uppercase text-xs tracking-widest mb-4 text-gold">Resources</h3>
            <ul className="space-y-2.5 text-slate-400 text-sm font-medium">
              <li><Link href="/partners" className="hover:text-gold transition-colors">Partners & Sponsors</Link></li>
              <li><Link href="/media" className="hover:text-gold transition-colors">Gallery & Events</Link></li>
              <li><Link href="/contact" className="hover:text-gold transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-extrabold text-white uppercase text-xs tracking-widest mb-4 text-gold">Connect With Us</h3>
            <ul className="space-y-3 text-slate-400 text-sm font-medium">
              <li className="flex items-center">
                <FiMail className="mr-3 text-gold shrink-0" />
                info@switchcode.tech
              </li>
              <li className="flex items-center">
                <FiPhone className="mr-3 text-gold shrink-0" />
                +20 101 234 5678
              </li>
              <li className="flex items-center">
                <FiMapPin className="mr-3 text-gold shrink-0" />
                Egypt & Global Online
              </li>
            </ul>
            <div className="flex space-x-3 mt-6">
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-blue-500/20 flex items-center justify-center text-slate-300 hover:text-gold hover:border-gold transition-all">
                <FiGithub className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-blue-500/20 flex items-center justify-center text-slate-300 hover:text-gold hover:border-gold transition-all">
                <FiTwitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-blue-500/20 flex items-center justify-center text-slate-300 hover:text-gold hover:border-gold transition-all">
                <FiLinkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-blue-500/20 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Switch Code Platform. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 font-medium">
            <Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
