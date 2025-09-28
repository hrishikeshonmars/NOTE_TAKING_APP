import React, { useState, FormEvent, useContext } from 'react';
import { Button, Input, Spinner } from './ui';
import { AuthContext } from '../App';

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = useContext(AuthContext);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await auth.login(email, password);
      } else {
        await auth.signup(username, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-amber-200 rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800">{isLogin ? 'Login' : 'Sign up'}</h2>
            <p className="text-gray-500">Keep Notes</p>
          </div>

          {error && <p className="text-red-500 text-center bg-red-100 p-2 rounded-md">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input id="username" label="Username" type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            )}
            <Input id="email" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input id="password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            {!isLogin && (
              <Input id="confirmPassword" label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            )}

            <div className="pt-2">
              <Button type="submit" variant="primary" isLoading={isLoading}>
                {isLogin ? 'Login' : 'Register'}
              </Button>
            </div>
          </form>

          {/* {isLogin && (
            // <div className="text-center text-sm text-gray-500 bg-amber-100 p-3 mt-4 rounded-md border border-amber-200">
            //   <p className="font-semibold">Demo Account:</p>
            //   <p>Email: <code className="font-mono bg-gray-200 p-1 rounded">deva@example.com</code></p>
            //   <p>Password: <code className="font-mono bg-gray-200 p-1 rounded">password123</code></p>
            // </div>
          )} */}

          <div className="text-center mt-4">
            <button onClick={toggleForm} className="text-teal-600 hover:underline">
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
