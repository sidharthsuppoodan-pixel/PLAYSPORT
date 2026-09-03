import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 PLAYSPORT. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <Link to="/privacy" className="hover:text-slate-900 transition">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900 transition">Terms</Link>
            <Link to="/support" className="hover:text-slate-900 transition">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
