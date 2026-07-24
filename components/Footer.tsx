import Link from 'next/link';
import { FiMail, FiPhone, FiMapPin, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-dark-light border-t border-primary/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">SC</span>
              </div>
              <span className="text-xl font-bold text-white">Switch Code</span>
            </div>
            <p className="text-gray-400 text-sm">
              Empowering the next generation of tech leaders through world-class education.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
              <li><Link href="/tracks" className="hover:text-accent transition-colors">Tracks</Link></li>
              <li><Link href="/team" className="hover:text-accent transition-colors">Team</Link></li>
              <li><Link href="/projects" className="hover:text-accent transition-colors">Projects</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link href="/partners" className="hover:text-accent transition-colors">Partners</Link></li>
              <li><Link href="/media" className="hover:text-accent transition-colors">Gallery</Link></li>
              <li><Link href="/contact" className="hover:text-accent transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-center">
                <FiMail className="mr-2 text-accent" />
                info@switchcode.tech
              </li>
              <li className="flex items-center">
                <FiPhone className="mr-2 text-accent" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center">
                <FiMapPin className="mr-2 text-accent" />
                Global (Online)
              </li>
            </ul>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-accent transition-colors">
                <FiGithub className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-accent transition-colors">
                <FiTwitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-accent transition-colors">
                <FiLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary/20 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Switch Code. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
