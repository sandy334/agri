
import React, { useState } from 'react';
import { User } from '../types';
import { StorageService, AuthService } from '../services';

interface LoginProps {
  onLogin: (u: User) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      let user: User;
      if (isLogin) {
        user = await AuthService.login(email, password);
      } else {
        user = await AuthService.register(email, password);
      }

      // Persist session
      StorageService.saveUser(user);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-800 to-emerald-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 text-2xl">
            <i className="fa-solid fa-leaf"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">AgriCloud</h1>
          <p className="text-gray-500">Smart Irrigation & Farm Management</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2 border border-red-100">
            <i className="fa-solid fa-circle-exclamation"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
              placeholder="farmer@agricloud.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition"
              placeholder="••••••••"
              minLength={4}
            />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-transform active:scale-95 shadow-lg shadow-green-200">
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            {isLogin ? "New to AgriCloud? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(""); }} 
              className="text-green-600 font-semibold hover:underline"
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
