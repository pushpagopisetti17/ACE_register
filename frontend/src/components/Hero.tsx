import React from 'react';
import { ArrowDown, Sparkles } from 'lucide-react';

const Hero = () => {
  const scrollToRegistration = () => {
    const element = document.getElementById('register');

    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="absolute bottom-20 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-400/5 rounded-full blur-3xl" />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 hero-grid opacity-40" />

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-24">

        {/* ACE Logo */}
        <div className="mb-8">
          <img
            src="/images/ace-logo.jpg"
            alt="ACE Logo"
            className="h-24 w-24 sm:h-28 sm:w-28 mx-auto object-contain rounded-full border-2 border-cyan-300/50 shadow-2xl shadow-cyan-500/20"
          />
        </div>

        {/* Small label */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-7 rounded-full border border-cyan-400/25 bg-cyan-400/5 text-cyan-300 text-xs sm:text-sm tracking-wide">
          <Sparkles size={15} />
          Association of Computer Engineers
        </div>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-5">
          <span className="text-white">
            Welcome to{' '}
          </span>

          <span className="text-cyan-300 neon-text">
            ACE
          </span>
        </h1>

        {/* Tagline */}
        <h2 className="text-lg sm:text-xl md:text-2xl font-medium tracking-[0.25em] text-gray-300 mb-7">
          Innovate. Lead. Excel.
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
          The Official CSE Student Club at SRKR Engineering College
        </p>

        {/* Register button */}
        <button
          onClick={scrollToRegistration}
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-cyan-400 text-black font-bold text-lg transition-all duration-300 hover:bg-cyan-300 hover:scale-105 shadow-xl shadow-cyan-500/20"
        >
          <span>Register Now</span>

          <ArrowDown
            size={21}
            className="group-hover:translate-y-1 transition-transform"
          />
        </button>

        {/* Small bottom text */}
        <p className="mt-8 text-xs text-gray-600 tracking-wider">
          SRKR ENGINEERING COLLEGE • CSE STUDENT CLUB
        </p>

      </div>
    </section>
  );
};

export default Hero;