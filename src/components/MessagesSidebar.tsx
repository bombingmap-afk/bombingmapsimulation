import { MessageSquare, X } from "lucide-react";

import MessagesList from "./Messages";
import React from "react";

interface MessagesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessagesSidebar: React.FC<MessagesSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div
        className={`
        fixed top-0 right-0 h-full w-96 bg-gray-800 shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Bombing Messages</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Real-time messages from bombers worldwide
          </p>
        </div>
        <MessagesList />
      </div>
    </>
  );
};

export default MessagesSidebar;
