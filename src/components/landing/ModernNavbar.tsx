
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ModernNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for active section
  useEffect(() => {
    const sections = ['funcionalidades', 'app', 'precos'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-88px 0px -50% 0px'
      }
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 88; // navbar height + padding
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const navItems = [
    { label: 'Funcionalidades', id: 'funcionalidades' },
    { label: 'App', id: 'app' },
    { label: 'Preços', id: 'precos' }
  ];

  return (
    <nav 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 border-gray-200' 
          : 'bg-white/80 border-gray-200/50'
      } backdrop-blur-md border rounded-full shadow-lg`}
      aria-label="Navegação principal"
    >
      <div className="px-6 py-3">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between gap-8 min-w-[600px]">
          {/* Logo */}
          <button
            onClick={scrollToTop}
            className="text-black font-bold text-lg hover:text-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-white rounded"
          >
            MoneyZap
          </button>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-white text-black ${
                  activeSection === item.id
                    ? 'border-2 border-emerald-600'
                    : 'hover:bg-gray-100'
                }`}
                aria-current={activeSection === item.id ? 'page' : undefined}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Botão Entrar */}
          <Button variant="outline" asChild className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-between min-w-[280px]">
          <button
            onClick={scrollToTop}
            className="text-black font-bold text-lg hover:text-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-white rounded"
          >
            MoneyZap
          </button>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              <Link to="/login">Entrar</Link>
            </Button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-black p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-white"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl mx-4"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 text-black ${
                    activeSection === item.id
                      ? 'border-2 border-emerald-600'
                      : 'hover:bg-gray-100'
                  }`}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default ModernNavbar;
