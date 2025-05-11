import React, { useState } from 'react';
// import './Login.css'; // If using a separate CSS file

// Define the duration (5 days in milliseconds)
const LOGIN_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days * 24 hours * 60 mins * 60 secs * 1000 ms
const LOCAL_STORAGE_EXPIRATION_KEY = 'loginExpiration';
const LOCAL_STORAGE_USER_KEY = 'loggedInUserEmail'; // Or use a token key if using API tokens

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (event) => {
    event.preventDefault(); // Prevent default form submission
    setError(''); // Clear previous errors

    // --- Simple hardcoded validation ---
    // Replace with API call later. In a real app, the API would return success/failure
    // and potentially a session token.
    if (email === 'abc@testmail.com' && password === 'abc') {
      console.log('Login successful');

      // --- Persistence Logic ---
      const expirationTime = Date.now() + LOGIN_DURATION_MS; // Calculate expiration timestamp

      try {
        // Store user identifier and expiration time in localStorage
        // IMPORTANT: Don't store sensitive data like passwords in localStorage!
        // Store the email here for simplicity, but a session token is preferred in real apps.
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, email);
        localStorage.setItem(LOCAL_STORAGE_EXPIRATION_KEY, expirationTime.toString()); // Store as string
        console.log(`Login state saved to localStorage. Expires at: ${new Date(expirationTime).toLocaleString()}`);

        // Callback to update App state, passing the user identifier
        onLoginSuccess(email);

      } catch (storageError) {
        console.error("Failed to save login state to localStorage:", storageError);
        setError("Could not save login session. Please ensure browser storage is enabled.");
        // Optionally, still allow login for the current session without persistence
        // onLoginSuccess(email);
      }

    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="login-container"> {/* Add className if using Login.css */}
      <div className="login-box">  {/* Add className if using Login.css */}
        <img src="src\assets\logo.png" alt="" width={"200px"}/>
        <h2>Login/SignUp</h2>
        <form onSubmit={handleLogin} className="login-form"> {/* Add className if using Login.css */}
          <div className="input-group"> {/* Add className if using Login.css */}
            <label htmlFor="email">Gmail ID</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g., abc@testmail.com" // Updated placeholder
            />
          </div>
          <div className="input-group"> {/* Add className if using Login.css */}
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password (abc)" // Updated placeholder
            />
          </div>
          {error && <p className="login-error">{error}</p>} {/* Add className if using Login.css */}
          <button type="submit" className="login-button"> {/* Add className if using Login.css */}
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;