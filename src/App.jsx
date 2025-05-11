import React, { useState, useEffect, useCallback, createContext } from 'react';
import LoginPage from './components/LoginPage'; // Ensure path is correct
import WorkflowApp from './WorkflowApp'; // Your main app component
import './App.css';

// Define localStorage keys (can be imported from a constants file)
const LOCAL_STORAGE_EXPIRATION_KEY = 'loginExpiration';
const LOCAL_STORAGE_USER_KEY = 'loggedInUserEmail';

// Create Node Selection Context
// It's often better to keep Context definition separate or within the component that primarily uses it (like WorkflowApp),
// but keeping it here is fine if multiple sibling components under App might need it.
export const NodeSelectionContext = createContext({
  selectedNodeId: null,
  setSelectedNodeId: () => { },
});

const App = () => {
  // State for authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Optional state to store user info (like email or token)
  const [userInfo, setUserInfo] = useState(null);
  // State for the Node Selection Context
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  // Loading state to prevent flash of login page if checking storage takes time (optional but good UX)
  const [isLoading, setIsLoading] = useState(true);

  // --- Function to clear authentication state ---
  const clearAuthState = useCallback(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_EXPIRATION_KEY);
    } catch (error) {
      console.error("Error removing auth state from localStorage:", error);
    }
    setIsAuthenticated(false);
    setUserInfo(null);
    console.log('Authentication state cleared.');
  }, []); // No dependencies needed as it only uses stable setters and localStorage


  // --- Check localStorage on initial component mount ---
  useEffect(() => {
    console.log("Checking persistent login state...");
    try {
      const storedExpiration = localStorage.getItem(LOCAL_STORAGE_EXPIRATION_KEY);
      const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);

      if (storedExpiration && storedUser) {
        const expirationTime = parseInt(storedExpiration, 10);
        const currentTime = Date.now();

        if (!isNaN(expirationTime) && currentTime < expirationTime) {
          // Login is still valid
          console.log(`Found valid login session for ${storedUser}. Restoring.`);
          setIsAuthenticated(true);
          setUserInfo(storedUser); // Restore user info
        } else {
          // Login expired or invalid timestamp
          console.log('Login session found but expired or invalid. Clearing.');
          clearAuthState(); // Clean up expired/invalid data
        }
      } else {
        console.log('No valid login session found in localStorage.');
        // Ensure state is cleared if items are missing
        clearAuthState();
      }
    } catch (error) {
       console.error("Error reading auth state from localStorage:", error);
       // Ensure logged out state if reading fails
       clearAuthState();
    } finally {
        // Stop loading indicator regardless of outcome
        setIsLoading(false);
    }
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearAuthState]); // Include clearAuthState in dependencies

  // --- Handler for successful login from LoginPage ---
  const handleLoginSuccess = useCallback((userIdentifier) => {
    console.log(`Login successful for ${userIdentifier}, updating App state.`);
    setIsAuthenticated(true);
    setUserInfo(userIdentifier);
    // localStorage is already set by LoginPage
  }, []); // Dependencies: stable setters

  // --- Handler for explicit logout ---
  const handleLogout = useCallback(() => {
    console.log("Logout requested.");
    clearAuthState();
    // Optional: redirect to login page or show a message if needed,
    // but conditional rendering handles showing the LoginPage automatically.
  }, [clearAuthState]); // Dependency: clearAuthState

  // --- Render loading state ---
  if (isLoading) {
      // Optional: Add a spinner or loading message
      return <div>Loading...</div>;
  }

  // --- Render based on authentication state ---
  return (
    <NodeSelectionContext.Provider value={{ selectedNodeId, setSelectedNodeId }}>
      {
        !isAuthenticated ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : (
          // Pass user info and logout handler to the main app
          <WorkflowApp currentUser={userInfo} onLogout={handleLogout} />
        )
      }
    </NodeSelectionContext.Provider>
  );
};

export default App;
