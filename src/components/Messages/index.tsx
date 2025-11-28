import React, { useEffect, useRef, useState } from "react";

import { Clock } from "lucide-react";
import { functions } from "../../config/firebase";
import { getCountryFlag } from "../../utils/countryFlags";
import { httpsCallable } from "firebase/functions";

interface Message {
  id: string;
  country: string;
  message: string;
  timestamp: string;
  gifUrl?: string;
  source?: string;
}

interface MessagesListProps {
  country?: string;
  nbTotalMessages: number;
}

const MessagesList: React.FC<MessagesListProps> = ({
  country,
  nbTotalMessages,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastTimestamp, setLastTimestamp] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getCountryMessagesFn = httpsCallable<
    { country?: string; limit?: number; lastTimestamp?: string },
    { messages: Message[] }
  >(functions, "getCountryMessages");

  useEffect(() => {
    loadInitialMessages();
  }, []);

  const loadInitialMessages = async () => {
    setIsLoading(true);
    try {
      const { data } = await getCountryMessagesFn({
        country,
        limit: 10,
      });

      const newMessages: Message[] = data.messages;
      setMessages(newMessages);
      setLastTimestamp(
        newMessages.length > 0
          ? newMessages[newMessages.length - 1].timestamp
          : null
      );
      setHasMore(newMessages.length < nbTotalMessages);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || isLoading || !lastTimestamp) return;

    setIsLoading(true);
    try {
      const { data } = await getCountryMessagesFn({
        country,
        limit: 10,
        lastTimestamp,
      });

      const newMessages: Message[] = data.messages;
      setMessages((prev) => [...prev, ...newMessages]);
      setLastTimestamp(
        newMessages.length > 0
          ? newMessages[newMessages.length - 1].timestamp
          : lastTimestamp
      );
      setHasMore(
        newMessages.length > 0 &&
          messages.length + newMessages.length < nbTotalMessages
      );
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (
      scrollTop + clientHeight >= scrollHeight - 100 &&
      hasMore &&
      !isLoading
    ) {
      loadMoreMessages();
    }
  };

  const formatTime = (
    timestamp: { _seconds: number; _nanoseconds: number } | number | string
  ): string => {
    let date: Date;

    if (
      typeof timestamp === "object" &&
      "_seconds" in timestamp &&
      "_nanoseconds" in timestamp
    ) {
      const ms =
        timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1e6);
      date = new Date(ms);
    } else if (typeof timestamp === "number") {
      date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return "Invalid date";

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

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-3"
      style={{ height: "calc(100vh - 120px)" }}
    >
      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🕊️</div>
          <p className="text-gray-400">
            No bombs dropped {country && "on this country"} today
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {country ? "This nation" : "The world"} remains peaceful...
          </p>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <div
              key={message.id}
              className="bg-gray-700 rounded-lg p-4 border-l-4 border-red-500 hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                {country ? (
                  <span className="text-yellow-400 font-semibold">
                    💣 Attack #{index + 1}
                  </span>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {getCountryFlag(message.country)}
                    </span>
                    <span className="text-white font-semibold">
                      {message.country}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-1 text-gray-400 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(message.timestamp)}</span>
                </div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <p className="text-gray-200">"{message.message}"</p>
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
              </div>
            </div>
          ))}
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
  );
};

export default MessagesList;
