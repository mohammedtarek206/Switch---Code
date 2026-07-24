'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { FiMenu, FiX, FiSun, FiMoon, FiUser, FiLogOut, FiSettings, FiArrowRight } from 'react-icons/fi';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState('en');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: { en: 'Home', ar: 'الرئيسية' } },
    { href: '/tracks', label: { en: 'Tracks', ar: 'المسارات' } },
    { href: '/team', label: { en: 'Team', ar: 'الفريق' } },
    { href: '/projects', label: { en: 'Projects', ar: 'المشاريع' } },
    { href: '/partners', label: { en: 'Partners', ar: 'الشركاء' } },
    { href: '/contact', label: { en: 'Contact', ar: 'تواصل' } },
  ];

  if (!mounted) return null;

  return (
    <nav className="fixed top-0 w-full bg-dark/90 backdrop-blur-md z-50 border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">SC</span>
            </div>
            <span className="text-xl font-bold text-white">Switch Code</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-accent transition-colors font-medium"
              >
                {link.label[lang as 'en' | 'ar']}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg hover:bg-primary/20 transition-colors text-gray-300"
            >
              {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="px-3 py-1 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all text-sm"
            >
              {lang === 'en' ? 'العربية' : 'English'}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                {user.role === 'admin' && (
                  <Link
                    href="/admin/dashboard"
                    className="text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-all mr-2"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white text-sm font-bold transition-all flex items-center group"
                >
                  Dashboard
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  title="Logout"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-8 py-2 bg-gradient-to-r from-primary to-accent hover:shadow-[0_0_20px_rgba(0,163,255,0.3)] rounded-full text-white text-sm font-black uppercase tracking-widest transition-all"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white"
          >
            {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-6 border-t border-white/5 space-y-4 bg-dark">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-gray-300 hover:text-accent transition-colors text-lg"
              >
                {link.label[lang as 'en' | 'ar']}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/5 space-y-4">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center space-x-3 text-white">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <FiUser size={16} />
                      </div>
                      <span className="font-bold">{user.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-red-400 font-bold text-sm flex items-center"
                    >
                      <FiLogOut className="mr-2" /> Logout
                    </button>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-center py-4 bg-white/5 rounded-2xl text-white font-bold border border-white/10"
                  >
                    Go to Dashboard
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full text-center py-4 bg-primary/20 text-primary rounded-2xl font-bold border border-primary/20"
                    >
                      Admin Panel
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center py-4 bg-gradient-to-r from-primary to-accent rounded-2xl text-white font-black uppercase tracking-widest"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
