import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-color">
      {/* Left side decoration */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-300 rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative z-10 text-white p-12 max-w-lg text-center animate-fade-in">
          <div className="bg-white/20 p-4 rounded-full inline-block mb-8 backdrop-blur-md">
            <ShieldCheck size={64} className="text-white drop-shadow-lg" />
          </div>
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight drop-shadow-md">
            Academic Blockchain System
          </h1>
          <p className="text-xl text-blue-100 font-light leading-relaxed">
            Secure, immutable, and verifiable digital academic certificates powered by cryptography.
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="glass card w-full max-w-md p-10 animate-slide-up relative overflow-hidden shadow-2xl">
          <div className="flex flex-col mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-secondary">Sign in to manage academic records</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="form-group">
              <label className="form-label font-medium">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  className="form-input pl-4 py-3 w-full border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary transition-all" 
                  placeholder="admin@system.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label font-medium">Password</label>
              <input 
                type="password" 
                className="form-input pl-4 py-3 w-full border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 focus:ring-2 focus:ring-primary transition-all" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full py-3 text-lg font-semibold tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center text-sm">
            <p className="text-secondary">
              Want to verify a certificate? <br/>
              <a href="/verify" className="text-primary font-medium hover:underline mt-1 inline-block">Access Public Verification Portal</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
