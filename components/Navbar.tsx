'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { FiMenu, FiX, FiSun, FiMoon, FiUser, FiLogOut, FiArrowRight, FiShield } from 'react-icons/fi';

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
    <nav className="fixed top-0 w-full bg-[#07111F]/80 backdrop-blur-xl z-50 border-b border-blue-500/20 shadow-lg shadow-black/40">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <img
              src="/Copilot_20250808_194655.png"
              alt="Switch Code Logo"
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight group-hover:text-gold transition-colors">Switch Code</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest -mt-1">Tech Platform</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-300 hover:text-gold transition-all font-semibold text-sm tracking-wide hover:-translate-y-0.5"
              >
                {link.label[lang as 'en' | 'ar']}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-xl bg-slate-900/60 border border-blue-500/20 hover:border-gold/50 transition-colors text-slate-300 hover:text-gold"
            >
              {theme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="px-3.5 py-1.5 bg-slate-900/60 border border-blue-500/20 rounded-xl text-slate-300 hover:text-gold transition-all text-xs font-bold"
            >
              {lang === 'en' ? 'العربية' : 'English'}
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                {['admin', 'super_admin', 'president'].includes(user.role) && (
                  <Link
                    href="/admin/dashboard"
                    className="text-gold text-xs font-black uppercase tracking-widest hover:brightness-125 transition-all flex items-center gap-1.5 bg-gold/10 px-3 py-1.5 rounded-xl border border-gold/30"
                  >
                    <FiShield /> Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center group"
                >
                  Dashboard
                  <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                  title="Logout"
                >
                  <FiLogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 transition-all border border-blue-400/30 hover:border-gold"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2.5 text-white bg-slate-900 border border-blue-500/20 rounded-xl"
          >
            {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-6 border-t border-blue-500/20 space-y-4 bg-[#07111F]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-slate-300 hover:text-gold transition-colors text-base font-semibold"
              >
                {link.label[lang as 'en' | 'ar']}
              </Link>
            ))}
            <div className="pt-4 border-t border-blue-500/20 space-y-4">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900/80 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center space-x-3 text-white">
                      <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-gold">
                        <FiUser size={16} />
                      </div>
                      <span className="font-bold text-sm">{user.name}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-red-400 font-bold text-xs flex items-center"
                    >
                      <FiLogOut className="mr-2" /> Logout
                    </button>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-center py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-extrabold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/30"
                  >
                    Go to Dashboard
                  </Link>

                  {['admin', 'super_admin', 'president'].includes(user.role) && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="block w-full text-center py-3.5 bg-gold/10 text-gold rounded-xl font-extrabold text-xs uppercase tracking-widest border border-gold/30"
                    >
                      Admin Panel
                    </Link>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white font-black uppercase tracking-widest shadow-lg shadow-blue-600/30"
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
