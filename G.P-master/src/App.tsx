can<file path="G.P-master/src/App.tsx">
      import React, { useState, useEffect, useRef, useCallback } from 'react';
      import { PlusCircle, Edit2, Trash2, ChevronLeft, MessageSquarePlus, Loader2, User, LogOut } from 'lucide-react'; // Added User, LogOut
      import { ChatSidebar } from './components/ChatSidebar';
      import { ChatMessage } from './components/ChatMessage';
      import { Modal } from './components/Modal';
      // import { AuthModal } from './components/AuthModal'; // Import AuthModal
      import type { Chat, Message } from './types';

      // No official DeepSeek SDK, so we'll use fetch

      // --- localStorage Keys ---
      const USERS_KEY = 'chat_users'; // Stores simple list of usernames for demo

      function App() {
        // --- Authentication State ---
        // const [currentUser, setCurrentUser] = useState<string | null>(() => {
        //   // Try to load user from session storage (slightly more persistent than state but clears on browser close)
        //   return sessionStorage.getItem('currentUser');
        // });
        // const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
        // const [showSignOut, setShowSignOut] = useState(false);

        // --- Chat State ---
        const [chats, setChats] = useState<Chat[]>([]); // Initialize empty, load based on user
        const [currentChatId, setCurrentChatId] = useState<string | null>(null);
        const [input, setInput] = useState('');
        const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
        const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
        const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
        const [newChatName, setNewChatName] = useState('');
        const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
        const [loading, setLoading] = useState(false);
        const chatBoxRef = useRef<HTMLDivElement>(null);
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const [isThinking, setIsThinking] = useState(false);
        const userMenuRef = useRef<HTMLDivElement>(null); // Ref for user menu
        const [currentUser, setCurrentUser] = useState<string | null>("defaultUser");


        // --- Load Chats on User Change ---
        useEffect(() => {
          if (currentUser) {
            const savedChats = localStorage.getItem(`chats_${currentUser}`);
            setChats(savedChats ? JSON.parse(savedChats) : []);
            setCurrentChatId(null); // Reset current chat when user changes
          } else {
            setChats([]); // Clear chats if no user
            setCurrentChatId(null);
          }
        }, [currentUser]);

        // --- Save Chats on Change ---
        useEffect(() => {
          if (currentUser) {
            localStorage.setItem(`chats_${currentUser}`, JSON.stringify(chats));
          }
        }, [chats, currentUser]);


        // --- Scroll to Bottom ---
        useEffect(() => {
          if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
          }
        }, [chats, currentChatId, isThinking]);

        // --- Auto-resize Textarea ---
        useEffect(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          }
        }, [input]);

        // --- Close User Menu on Outside Click ---
        useEffect(() => {
          function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
              // setShowSignOut(false);
            }
          }
          document.addEventListener("mousedown", handleClickOutside);
          return () => {
            document.removeEventListener("mousedown", handleClickOutside);
          };
        }, [userMenuRef]);


        // --- Chat Functions ---
        const createNewChat = (firstMessage?: Message) => { // Optional first message
          if (!currentUser) return null; // Don't create chat if not logged in

          const newChat: Chat = {
            id: Date.now().toString(),
            name: 'New Chat',
            messages: firstMessage ? [firstMessage] : [], // Use first message if provided
            createdAt: Date.now(),
          };
          setChats(prev => [...prev, newChat]);
          setCurrentChatId(newChat.id);
          return newChat.id;
        };

        const handleSelectChat = (chatId: string) => {
          setCurrentChatId(chatId);
        };

        const handleSendMessage = async () => {
          if (!input.trim() || !currentUser) return; // Need user to send

          let chatId: string;
          let isNewChat = false;
          const userMessageContent = input;

          const newMessage: Message = {
            id: Date.now().toString(),
            content: userMessageContent,
            isUser: true,
            timestamp: Date.now(),
          };

          if (!currentChatId) {
            isNewChat = true;
            const newChatId = createNewChat(newMessage);
            if (!newChatId) return; // Exit if chat creation failed (no user)
            chatId = newChatId;
          } else {
            chatId = currentChatId;
            setChats(prevChats => {
              const updatedChats = prevChats.map(chat =>
                chat.id === chatId ? { ...chat, messages: [...chat.messages, newMessage] } : chat
              );
              // No need to save here, useEffect [chats, currentUser] handles it
              return updatedChats;
            });
          }

          setInput('');
          setIsThinking(true);

          try {
            const currentChatMessages = chats.find(chat => chat.id === chatId)?.messages || (isNewChat ? [newMessage] : []);

            const messagesForAPI = [
              {
                role: "system",
                content: `You are a helpful health AI assistant... [Your existing system prompt] ...Health-Related Only: If the user asks a question that is not clearly and directly related to health. Also at the end of the text you must tell me what the medical problem name is.`,
              },
              ...currentChatMessages
                .filter(msg => msg.id !== newMessage.id || !isNewChat) // Exclude the new message if it was just added to state
                .map(msg => ({
                  role: msg.isUser ? "user" : "assistant",
                  content: msg.content
                })),
              {
                role: "user",
                content: userMessageContent,
              },
            ];

            const response = await fetch("https://api.deepseek.com/v1/chat/completions", { /* ... fetch options ... */
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
              },
              body: JSON.stringify({
                model: "deepseek-chat",
                messages: messagesForAPI,
                max_tokens: 512,
                temperature: 0.5,
                top_p: 0.9,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => null);
              const errorText = (errorData?.error?.message) || response.statusText || 'Unknown Error';
              throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            let aiContent = data.choices[0].message.content;
            aiContent = postProcessResponse(aiContent);

            const aiMessage: Message = {
              id: data.id,
              content: aiContent,
              isUser: false,
              timestamp: Date.now(),
            };

            setChats(prevChats => {
              const updatedChats = prevChats.map(chat =>
                chat.id === chatId ? { ...chat, messages: [...chat.messages, aiMessage] } : chat
              );
              // No need to save here, useEffect [chats, currentUser] handles it
              return updatedChats;
            });

          } catch (error) {
            console.error("Error calling DeepSeek API:", error);
            const errorMessage: Message = {
              id: Date.now().toString(),
              content: `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred.'}`,
              isUser: false,
              timestamp: Date.now(),
            };
            setChats(prevChats => {
              const updatedChats = prevChats.map(chat =>
                chat.id === chatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
              );
              // No need to save here, useEffect [chats, currentUser] handles it
              return updatedChats;
            });
          } finally {
            setIsThinking(false);
          }
        };

        function postProcessResponse(response: string): string {
          let processedResponse = response;

          // 1. Limit consecutive newlines to a maximum of 2
          processedResponse = processedResponse.replace(/\n{3,}/g, '\n\n');

          // 2. Ensure numbered list items start on a new line
          processedResponse = processedResponse.replace(/^\s*(\d+)\.\s*/gm, '\n$1. ');

          // 3. Ensure an extra newline after each list item (numbered).
          processedResponse = processedResponse.replace(/(\n\s*\d+\.\s+.+?)(\n|$)/g, '$1\n\n$2');

          // 4. Ensure double newlines between paragraphs.
          processedResponse = processedResponse.replace(/\n\s*\n/g, '\n\n');

          // 5. Ensure bullet points start on a new line and have a space after the hyphen.
          processedResponse = processedResponse.replace(/^-/gm, '\n- ');
           // 6. Add an extra newline after each list item (bullet).
          processedResponse = processedResponse.replace(/(\n\s*[-*+]\s+.+?)(\n|$)/g, '$1\n\n$2');

          return processedResponse;
        }

        const handleRenameChat = (chatId: string, newChatName: string) => {
          setChats(prevChats =>
            prevChats.map(chat =>
              chat.id === chatId ? { ...chat, name: newChatName } : chat
            )
          );
          setIsRenameModalOpen(false);
          setSelectedChatId(null);
        };

        const handleDeleteChat = (chatId: string) => {
          setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
          if (currentChatId === chatId) {
            setCurrentChatId(null);
          }
          setIsDeleteModalOpen(false);
        };

        const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            debouncedSendMessage();
          }
        };

        const openRenameModal = (chatId: string) => {
          setSelectedChatId(chatId);
          const chat = chats.find(c => c.id === chatId);
          setNewChatName(chat?.name || '');
          setIsRenameModalOpen(true);
        };

        const handleRenameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') {
            handleRenameChat(selectedChatId!, newChatName);
          }
        };

        const debouncedSendMessage = useCallback(
          () => {
            handleSendMessage();
          },
          [chats, currentChatId, input]
        );

        // // --- Authentication Handlers ---
        // const handleLogin = (username: string) => {
        //   // INSECURE: Check if username exists in our simple list
        //   const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        //   if (users.includes(username)) {
        //     setCurrentUser(username);
        //     sessionStorage.setItem('currentUser', username); // Persist login across refresh
        //     setIsAuthModalOpen(false);
        //   } else {
        //     // In a real app, you'd show an error in the modal
        //     alert('Login failed: User not found.'); // Simple alert for demo
        //     console.error("Login failed: User not found.");
        //   }
        // };

        // const handleSignup = (username: string) => {
        //   // INSECURE: Add username if it doesn't exist
        //   const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        //   if (users.includes(username)) {
        //     alert('Signup failed: Username already exists.'); // Simple alert for demo
        //     console.error("Signup failed: Username already exists.");
        //   } else {
        //     users.push(username);
        //     localStorage.setItem(USERS_KEY, JSON.stringify(users));
        //     // Initialize chats for the new user
        //     localStorage.setItem(`chats_${username}`, JSON.stringify([]));
        //     setCurrentUser(username);
        //     sessionStorage.setItem('currentUser', username); // Persist login across refresh
        //     setIsAuthModalOpen(false);
        //   }
        // };

        // const handleSignOut = () => {
        //   setCurrentUser(null);
        //   sessionStorage.removeItem('currentUser');
        //   setShowSignOut(false); // Hide menu
        //   // Chat state will be cleared by the useEffect hook watching currentUser
        // };


        return (
          <div className="flex h-screen">
            <ChatSidebar
              chats={chats}
              currentChatId={currentChatId}
              isCollapsed={isSidebarCollapsed}
              onNewChat={() => createNewChat()} // Updated to not require message
              onSelectChat={handleSelectChat}
              onRenameChat={openRenameModal}
              onDeleteChat={(chatId) => {
                setSelectedChatId(chatId);
                setIsDeleteModalOpen(true);
              }}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              // onLogin={() => setIsAuthModalOpen(true)}
              // onSignup={() => setIsAuthModalOpen(true)}
              currentUser={currentUser}
            />

            <div className={`flex-1 flex flex-col bg-gray-900 text-gray-200 relative overflow-hidden ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
              {/* Top Bar - Adjusted for Auth */}
              <div className="flex items-center justify-between h-12 bg-gray-900 border-b border-gray-700 text-gray-300 px-4">
                {/* Chat Title */}
                <div className="flex-1 text-center">
                  {currentChatId ? (
                    chats.find(chat => chat.id === currentChatId)?.name
                  ) : (
                    <span className="text-gray-500">
                      {/*currentUser ? "Select or start a chat" : "Please Login or Sign Up"*/}
                      How can I help you today?
                    </span>
                  )}
                </div>

                {/* Auth Buttons / User Menu */}
                <div className="flex items-center space-x-2 relative" ref={userMenuRef}>
                  {/*currentUser ? (
                    <>
                      <button
                        onClick={() => setShowSignOut(!showSignOut)}
                        className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white font-bold text-sm focus:outline-none hover:bg-blue-700"
                        title={currentUser}
                      >
                        {currentUser.charAt(0).toUpperCase()}
                      </button>
                      {showSignOut && (
                        <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 z-50">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                          </button>
                        </div>
                      )}
                    </>
                  ) : null*/}
                </div>
              </div>

              {/* Message List Area */}
              <div className="flex-1 overflow-y-auto p-4" ref={chatBoxRef}>
                {/*currentUser ? ( // Only show messages if logged in*/}
                  {currentChatId && chats.find(chat => chat.id === currentChatId)?.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} content={message.content} />
                  ))}
                {/*) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Please login or sign up to start chatting.
                  </div>
                )*/}
                {isThinking && (
                  <div className="message ai-message">
                    <Loader2 className="animate-spin w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-700 bg-gray-900">
                <div className="flex items-center space-x-2">
                      <textarea
                        ref={textareaRef}
                        className="flex-1 p-2 border border-gray-600 bg-gray-800 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-hidden placeholder-gray-400 disabled:opacity-50"
                        placeholder={"Type your message here..."/*currentUser ? "Type your message here..." : "Login to chat"*/}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        style={{ maxHeight: '200px' }}
                        disabled={/* !currentUser ||*/ loading} // Disable if not logged in or loading
                      />
                      <button
                        className="bg-[#6dde4e] hover:bg-[#52be34] text-white p-2 rounded-lg disabled:opacity-50"
                        onClick={debouncedSendMessage}
                        disabled={/* !currentUser ||*/ loading || !input.trim()} // Disable if not logged in, loading, or no input
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auth Modal */}
                {/*<AuthModal
                  isOpen={isAuthModalOpen}
                  onClose={() => setIsAuthModalOpen(false)}
                  onLogin={handleLogin}
                  onSignup={handleSignup}
                />*/}

                {/* Rename Modal */}
                <Modal
                  isOpen={isRenameModalOpen}
                  onClose={() => setIsRenameModalOpen(false)}
                  title="Rename Chat"
                >
                  {/* ... rename modal content ... */}
                   <input
                    type="text"
                    className="chat-name-input mb-4"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    placeholder="Enter new chat name"
                    onKeyDown={handleRenameKeyDown}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                      onClick={() => setIsRenameModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                      onClick={() => handleRenameChat(selectedChatId!, newChatName)}
                    >
                      OK
                    </button>
                  </div>
                </Modal>

                {/* Delete Modal */}
                <Modal
                  isOpen={isDeleteModalOpen}
                  onClose={() => setIsDeleteModalOpen(false)}
                  title="Confirm Delete"
                >
                  {/* ... delete modal content ... */}
                   <p>Are you sure you want to delete this chat?</p>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                      onClick={() => handleDeleteChat(selectedChatId!)}
                    >
                      Delete
                    </button>
                  </div>
                </Modal>
              </div>
            );
          }

          export default App;
    </file>
