import React from 'react';

const Header = () => {
  const scrollToRegistration = () => {
    const element = document.getElementById('register');

    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-xl border-b border-cyan-400/20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3">
        <div className="flex items-center justify-between">

          {/* LEFT - SRKR COLLEGE */}
          <div className="flex items-center gap-3">
            <img
              src="/images/srkr-logo.jpg"
              alt="SRKR Engineering College Logo"
              className="h-11 w-11 sm:h-12 sm:w-12 object-contain"
            />

            <div>
              <h2 className="text-white font-bold text-sm sm:text-base tracking-wide">
                SRKR Engineering College
              </h2>

              <p className="text-gray-400 text-xs sm:text-sm">
                Bhimavaram
              </p>
            </div>
          </div>

          {/* CENTER - COLLEGE NAME ON MOBILE/SPACE */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 text-center">
            <p className="text-cyan-300 text-xs uppercase tracking-[0.25em]">
              Association of Computer Engineers
            </p>
          </div>

          {/* RIGHT - ACE LOGO */}
          <button
            onClick={scrollToRegistration}
            className="group"
            aria-label="Go to registration"
          >
            <img
              src="/images/ace-logo.jpg"
              alt="ACE Logo"
              className="h-11 w-11 sm:h-12 sm:w-12 object-contain rounded-full border border-cyan-300/40 shadow-lg shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-110"
            />
          </button>

        </div>
      </div>
    </header>
  );
};

export default Header;