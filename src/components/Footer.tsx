import { FileText, Mail, Shield } from "lucide-react";

import React from "react";

const Legal: React.FC = () => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <Shield className="w-5 h-5 text-green-400 mr-2" />
        <h3 className="text-white font-semibold">Legal & Safety</h3>
      </div>
      <ul className="space-y-2 text-sm text-gray-400">
        <li>• Virtual simulation only</li>
        <li>• No real violence promoted</li>
        <li>• Educational research project</li>
        <li>• 18+ content warning</li>
      </ul>
    </div>
  );
};

const Contact: React.FC = () => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <FileText className="w-5 h-5 text-yellow-400 mr-2" />
        <h3 className="text-white font-semibold">Important</h3>
      </div>
      <div className="space-y-2 text-sm text-gray-400">
        <p>This is a social experiment studying digital behavior patterns.</p>
        <p className="text-yellow-400 font-medium">
          No real harm intended or promoted.
        </p>
      </div>
    </div>
  );
};

const Disclaimer: React.FC = () => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <Mail className="w-5 h-5 text-blue-400 mr-2" />
        <h3 className="text-white font-semibold">Contact</h3>
      </div>
      <div className="space-y-2 text-sm text-gray-400">
        <p>For legal inquiries or concerns:</p>
        <p className="text-blue-400">bombingmap@gmail.com</p>
      </div>
    </div>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-700 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Legal />
          <Contact />
          <Disclaimer />
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm mb-2">
            World Bomb Map - Virtual Social Experiment © 2024
          </p>
          <p className="text-xs text-gray-500">
            This platform is designed for educational research on digital
            sociology and online community behavior. All activities are virtual
            and symbolic. No real violence is promoted or encouraged.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
