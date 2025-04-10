<file path="G.P-master/src/components/ChatSidebar.tsx">
      import React, { useState, useEffect, useRef } from 'react';
      import { PlusCircle, Edit2, Trash2, ChevronLeft, MessageSquarePlus, Phone, AlertTriangle, Loader2, LogIn, UserPlus, HeartPulse } from 'lucide-react'; // Added HeartPulse
      import type { Chat } from '../types';

      interface ChatSidebarProps {
        chats: Chat[];
        currentChatId: string | null;
        isCollapsed: boolean;
        onNewChat: () => void;
        onSelectChat: (chatId: string) => void;
        onRenameChat: (chatId: string) => void;
        onDeleteChat: (chatId: string) => void;
        onToggleSidebar: () => void;
        onAttemptRepair?: (chatId: string) => void;
        repairingChatId?: string | null;
        // onLogin: () => void;
        // onSignup: () => void;
        currentUser: string | null;
      }

      const emergencyContacts = {
        "Saudi Arabia": "997",
        "United States": "911",
        "United Kingdom": "999",
        "Canada": "911",
        "Australia": "000",
        "UAE": "999",
        "Kuwait": "112",
        "Bahrain": "999",
        "Qatar": "999",
        "Oman": "999",
      };

      const countryFlags = {
        "Saudi Arabia": "🇸🇦",
        "United States": "🇺🇸",
        "United Kingdom": "🇬🇧",
        "Canada": "🇨🇦",
        "Australia": "🇦🇺",
        "UAE": "🇦🇪",
        "Kuwait": "🇰🇼",
        "Bahrain": "🇧🇭",
        "Qatar": "🇶🇦",
        "Oman": "🇴🇲",
      };

      export function ChatSidebar({
        chats,
        currentChatId,
        isCollapsed,
        onNewChat,
        onSelectChat,
        onRenameChat,
        onDeleteChat,
        onToggleSidebar,
        onAttemptRepair,
        repairingChatId,
        // onLogin,
        // onSignup,
        currentUser,
      }: ChatSidebarProps) {
        const [selectedCountry, setSelectedCountry] = useState("Saudi Arabia");
        const [emergencyNumber, setEmergencyNumber] = useState(emergencyContacts["Saudi Arabia"]);
        const [editingChatId, setEditingChatId] = useState<string | null>(null);
        const [tempChatName, setTempChatName] = useState('');
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
          setEmergencyNumber(emergencyContacts[selectedCountry]);
        }, [selectedCountry]);

        useEffect(() => {
          if (editingChatId && inputRef.current) {
            inputRef.current.focus();
          }
        }, [editingChatId]);

        const handleRenameClick = (chatId: string) => {
          onRenameChat(chatId);
        };

        if (isCollapsed) {
          return (
            <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
              <button
                className="sidebar-toggle"
                onClick={onToggleSidebar}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>

              {/* Collapsed State: Show an icon instead of text */}
              <div className="collapsed-content pt-4"> {/* Added padding top */}
                 <HeartPulse className="w-8 h-8 mb-4" style={{ color: '#6dde4e' }} /> {/* Icon for collapsed */}
                <button
                  className="collapsed-new-chat"
                  onClick={onNewChat}
                  aria-label="New Chat"
                >
                  <MessageSquarePlus className="w-6 h-6" />
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <button
              className="sidebar-toggle"
              onClick={onToggleSidebar}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
            </button>

            <div className="sidebar-content flex flex-col h-full">
              {/* Expanded State: Show Text */}
              <div className="flex justify-center items-center h-16 mb-4"> {/* Adjusted height and added items-center */}
                <span
                  className="text-xl font-bold text-center"
                  style={{ color: '#6dde4e' }}
                >
                  Healthier with AI
                </span>
              </div>

              <button
                className="btn-new-chat"
                onClick={onNewChat}
              >
                <PlusCircle className="w-5 h-5 flex-shrink-0" />
                <span className="btn-text">New Chat</span>
              </button>

              <ul className="chat-list flex-grow overflow-y-auto mt-2">
                {chats.map((chat) => (
                  <li
                    key={chat.id}
                    className={`chat-item ${chat.id === currentChatId ? 'active' : ''} group`}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    <span className="chat-name flex items-center" style={{ color: '#4cb2fa' }}>
                      {chat.name}
                    </span>
                    <div className="chat-actions">
                      <button
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameClick(chat.id);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col px-4">
                {/*{!currentUser && (
                  <div className="mb-4 space-y-2">
                    <button
                      onClick={onLogin}
                      className="w-full flex items-center justify-start space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </button>
                    <button
                      onClick={onSignup}
                      className="w-full flex items-center justify-start space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Sign Up</span>
                    </button>
                  </div>
                )}*/}

                <div className="mb-4">
                  <label htmlFor="country" className="block text-sm font-medium" style={{ color: '#4cb2fa' }}>
                    Select Country:
                  </label>
                  <select
                    id="country"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    style={{ color: '#4cb2fa' }}
                  >
                    {Object.keys(emergencyContacts).map((country) => (
                      <option key={country} value={country} style={{ color: '#4cb2fa' }}>
                        {countryFlags[country]} {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4 p-4">
                  <p className="uppercase text-xs font-bold text-red-500 mb-2">Emergency Contact</p>
                  <div className="flex items-center">
                    <Phone className="w-6 h-6 text-red-500 mr-2" />
                    <p className="text-2xl font-extrabold text-red-500">
                      {emergencyNumber}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
    </file>
