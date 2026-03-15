/**
 * Development Login Component
 * 
 * ⚠️ DEVELOPMENT ONLY - REMOVE FOR PRODUCTION
 * 
 * Provides a simple login form for development testing without OAuth
 * Only appears when DEV_AUTH_MODE is enabled
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DevLoginProps {
  onLoginSuccess?: () => void;
}

export function DevLogin({ onLoginSuccess }: DevLoginProps) {
  const [email, setEmail] = useState('jadconsc@gmail.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call dev auth endpoint
      const response = await fetch('/api/dev-auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      // Set dev session cookie
      const data = await response.json();
      document.cookie = `dev-session=${data.token}; path=/; max-age=86400`;

      toast.success('Dev login successful! Redirecting to dashboard...');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);

      onLoginSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto border-yellow-300 bg-yellow-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <CardTitle className="text-yellow-900">Development Login</CardTitle>
        </div>
        <CardDescription className="text-yellow-800">
          ⚠️ This login form is for development testing only
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jadconsc@gmail.com"
              disabled={isLoading}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={isLoading}
              className="bg-white"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
            <strong>Test Credentials:</strong>
            <br />
            Email: jadconsc@gmail.com
            <br />
            Password: De3251ab
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              'Dev Login'
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          <strong>Note:</strong> This development login will be removed before production deployment.
        </div>
      </CardContent>
    </Card>
  );
}
