import React, { useState, useEffect } from 'react'; // Import useEffect

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => void; // Simplified: No password check
  onSignup: (username: string) => void; // Simplified: No password storage
}

export function AuthModal({ isOpen, onClose, onLogin, onSignup }: AuthModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Keep for UI, but not used securely
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to reset state when the modal closes
  useEffect(() => {
    if (!isOpen) {
      // Delay resetting slightly to avoid visual glitch if modal fades out
      const timer = setTimeout(() => {
        setUsername('');
        setPassword('');
        setError(null);
        // Ensure it defaults back to login mode when reopened
        setIsLoginMode(true);
      }, 200); // Adjust timing if needed based on modal transition

      return () => clearTimeout(timer); // Cleanup timer on unmount or if isOpen changes again quickly
    }
  }, [isOpen]); // Run this effect when the isOpen prop changes

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }
    // Basic validation (add more as needed)
    if (password.length < 4 && !isLoginMode) { // Simple check for signup
        setError('Password must be at least 4 characters long for signup.');
        return;
    }

    if (isLoginMode) {
      onLogin(username);
      // Parent component (App.tsx) will set isOpen to false on successful login
    } else {
      onSignup(username);
      // Parent component (App.tsx) will set isOpen to false on successful signup
    }
    // No need to reset state here, the useEffect handles it when isOpen becomes false
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null); // Clear errors when switching mode
    setUsername(''); // Clear fields when switching mode
    setPassword(''); // Clear fields when switching mode
  };

  // Use a separate handler for the cancel/close button click
  const handleCloseClick = () => {
    onClose(); // This will trigger the useEffect cleanup eventually
  };

  return (
    // Pass handleCloseClick to the overlay onClick
    <div className="modal-overlay" onClick={handleCloseClick}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{isLoginMode ? 'Login' : 'Sign Up'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isLoginMode ? undefined : 4} // Basic length check for signup
            />
            {error && <p className="text-red-500 text-xs italic">{error}</p>}
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              {isLoginMode ? 'Login' : 'Sign Up'}
            </button>
            <button
              type="button"
              className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              onClick={switchMode}
            >
              {isLoginMode ? 'Need an account? Sign Up' : 'Have an account? Login'}
            </button>
          </div>
           <button
              type="button"
              className="mt-4 text-sm text-gray-600 hover:text-gray-800"
              onClick={handleCloseClick} // Use the specific close handler
            >
              Cancel
            </button>
        </form>
      </div>
    </div>
  );
}
