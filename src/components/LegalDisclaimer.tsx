import { BookOpen, Info, Shield, Sparkles, Users } from "lucide-react";
import React, { useState } from "react";

const LegalDisclaimer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [hasAccepted, setHasAccepted] = useState(
    localStorage.getItem("legal-disclaimer-accepted") === "true"
  );

  const handleAccept = () => {
    localStorage.setItem("legal-disclaimer-accepted", "true");
    setHasAccepted(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    window.location.href = "https://google.com";
  };

  if (hasAccepted || !isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-10 h-10 mr-3 animate-pulse" />
            <h1 className="text-3xl font-bold">Welcome to World Bomb Map!</h1>
          </div>
          <p className="text-center text-blue-100 text-lg">
            A fascinating social experiment exploring digital communities
          </p>
        </div>
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: "calc(100vh - 280px)" }}
        >
          <div className="space-y-6 text-gray-700">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-400 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <BookOpen className="w-6 h-6 text-green-600 mr-2" />
                <h2 className="text-xl font-bold text-green-800">
                  Educational Research Project
                </h2>
              </div>
              <p className="text-sm text-green-700">
                This platform is a <strong>virtual social experiment</strong>{" "}
                designed to study online behavior, community dynamics, and
                digital interaction patterns in a safe, controlled environment.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start">
                <Users className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">
                    Community Experiment
                  </h3>
                  <p className="text-sm text-gray-600">
                    Join thousands of users in this unique digital sociology
                    study. Observe how virtual communities form, interact, and
                    evolve over time.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-purple-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">
                    100% Virtual & Safe
                  </h3>
                  <p className="text-sm text-gray-600">
                    All activities are purely symbolic and digital. This is a
                    simulation - no real countries, governments, or individuals
                    are involved in any way.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Info className="w-5 h-5 text-orange-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">
                    Research Purpose
                  </h3>
                  <p className="text-sm text-gray-600">
                    Data collected helps researchers understand online behavior
                    patterns, community formation, and digital social dynamics.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-2">
                Technical Details
              </h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• All data is anonymized</li>
                <li>• You must be 18+ to participate</li>
                <li>• No personal information is collected</li>
                <li>• You can leave at any time</li>
              </ul>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Academic Context:</strong> This research contributes to
                understanding digital communities and online social behavior.
                Results may be published in academic journals with full
                anonymization.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 p-6 border-t">
          <div className="flex space-x-4">
            <button
              onClick={handleDecline}
              className="flex-1 py-3 px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg
                       transition-all duration-200 font-semibold"
            >
              Not Interested
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 
                       hover:from-blue-700 hover:to-purple-700 text-white rounded-lg
                       transition-all duration-200 font-semibold transform hover:scale-105"
            >
              Join the Experiment! 🚀
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            By clicking "Join the Experiment!", you acknowledge that you have
            read and understood this disclaimer.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalDisclaimer;
