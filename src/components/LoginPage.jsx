import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import './Login.css'; // If using a separate CSS file

// Define the duration (5 days in milliseconds)
const LOGIN_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days * 24 hours * 60 mins * 60 secs * 1000 ms
const LOCAL_STORAGE_EXPIRATION_KEY = 'loginExpiration';
const LOCAL_STORAGE_USER_KEY = 'loggedInUserEmail'; // Or use a token key if using API tokens

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setError(''); // Clear previous errors

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // if (!response.ok) {
      //   throw new Error('Network response was not ok');
      // }

      const data = await response.json();
      const { valid, email: returnedEmail,error: errorMsg, message } = data;

    

      if(valid == true && message != null)
      {
        localStorage.setItem('loginMessage', message); 
        console.log(message);
      }
        

      if (valid === true && returnedEmail != null) {
        console.log('Login successful');

        const expirationTime = Date.now() + LOGIN_DURATION_MS;

        try {
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, returnedEmail);
          localStorage.setItem(LOCAL_STORAGE_EXPIRATION_KEY, expirationTime.toString());
          console.log(`Login state saved to localStorage. Expires at: ${new Date(expirationTime).toLocaleString()}`);
          onLoginSuccess(returnedEmail);
        } catch (storageError) {
          console.error("Failed to save login state to localStorage:", storageError);
          setError("Could not save login session. Please ensure browser storage is enabled.");
        }
      } else {
        setError('Invalid email or password.');
      }

    } catch (apiError) {
      console.error("Login API call failed:", apiError);
      setError('An error occurred while trying to log in. Please try again later.');
    }
  };

  return (
    <div className="login-container"> {/* Add className if using Login.css */}
      <div className="login-box">  {/* Add className if using Login.css */}
        <img src="src\assets\logo.png" alt="" width={"200px"} />
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
              placeholder="Enter your Mail ID" // Updated placeholder
            />
          </div>
          <div className="input-group"> 
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password" // Updated placeholder
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default LoginPage;