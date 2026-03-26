import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation('/');
    }
  }, [isAuthenticated, loading, setLocation]);

  // Get error from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const error = searchParams.get('error');

  const handleGoogleLogin = () => {
    window.location.href = '/api/oauth/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-indigo-600 text-white flex items-center justify-center rounded-lg font-bold text-xl">
              CC
            </div>
          </div>
          <CardTitle className="text-2xl">ComplyCode</CardTitle>
          <CardDescription>Building Code Compliance Made Simple</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              <p className="font-semibold">Login Failed</p>
              <p className="mt-1">
                {error === 'access_denied' && 'You denied access. Please try again.'}
                {error === 'csrf_validation_failed' && 'Security validation failed. Please try again.'}
                {error === 'oauth_callback_failed' && 'An error occurred during login. Please try again.'}
                {error === 'oauth_init_failed' && 'Failed to initialize login. Please try again.'}
                {!['access_denied', 'csrf_validation_failed', 'oauth_callback_failed', 'oauth_init_failed'].includes(error) && error}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleGoogleLogin}
              className="w-full h-11 bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 font-semibold text-base flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Login with Google
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700">
            <p className="font-semibold mb-2">Welcome to ComplyCode</p>
            <p>
              ComplyCode helps you identify building occupancy codes and compliance requirements based on the National Building Code 2023 Alberta Edition.
            </p>
          </div>

          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>By logging in, you agree to our</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                Terms of Service
              </a>
              <span>and</span>
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
