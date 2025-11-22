import { Clock, MessageSquare, X } from "lucide-react";
import {
  DocumentSnapshot,
  Timestamp,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";

import { db } from "../config/firebase";
import { getCountryFlag } from "../utils/countryFlags";

interface Message {
  id: string;
  country: string;
  message: string;
  timestamp: Timestamp;
  gifUrl?: string;
  source?: string;
}

interface MessagesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const getTodayRange = () => {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  return {
    start: Timestamp.fromDate(startOfDay),
    end: Timestamp.fromDate(endOfDay),
  };
};

const MessagesSidebar: React.FC<MessagesSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialMessages();
    } else {
      // Reset when closing
      setMessages([]);
      setLastDoc(null);
      setHasMore(true);
    }
  }, [isOpen]);

  const loadInitialMessages = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getTodayRange();

      const q = query(
        collection(db, "bombs"),
        where("timestamp", ">=", start),
        where("timestamp", "<", end),
        orderBy("timestamp", "desc"),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const newMessages: Message[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Message)
      );

      setMessages(newMessages);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!lastDoc || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const { start, end } = getTodayRange();

      const q = query(
        collection(db, "bombs"),
        where("timestamp", ">=", start),
        where("timestamp", "<", end),
        orderBy("timestamp", "desc"),
        startAfter(lastDoc),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const newMessages: Message[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Message)
      );

      setMessages((prev) => [...prev, ...newMessages]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (isNearBottom && hasMore && !isLoading) {
      loadMoreMessages();
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 right-0 h-full w-96 bg-gray-800 shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        {/* Header */}
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

        {/* Messages List */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ height: "calc(100vh - 120px)" }}
        >
          {messages.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No messages at the moment</p>
              <p className="text-gray-500 text-sm mt-2">
                Bombings will appear here
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="bg-gray-700 rounded-lg p-4 border-l-4 border-red-500 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {getCountryFlag(message.country)}
                      </span>
                      <span className="text-white font-semibold">
                        {message.country}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-gray-400 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(message.timestamp)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded p-3">
                    <p className="text-gray-200 italic">"{message.message}"</p>
                  </div>
                  {message.gifUrl && (
                    <div className="mt-3 text-center">
                      <img
                        src={message.gifUrl}
                        alt="GIF preview"
                        className="mx-auto rounded-lg max-h-40"
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    {message.source && (
                      <p className="text-gray-400 text-sm mt-2 text-center">
                        Attacker: {message.source}
                      </p>
                    )}
                    <div className="flex items-center justify-end mt-2">
                      <span className="text-gray-500 text-xs">
                        {message.timestamp.toDate().toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-400 text-sm">Loading messages...</p>
                </div>
              )}

              {/* End of messages */}
              {!hasMore && messages.length > 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">
                    All messages have been loaded
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MessagesSidebar;
