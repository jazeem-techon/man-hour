import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const loginRes = await api.post('/login', { email, password });
      const token = loginRes.data?.token || loginRes.data?.access_token || loginRes.data;
      
      if (!token || typeof token !== 'string') {
        throw new Error("Invalid response from server");
      }

      // Store token so the interceptor can use it for the next request
      localStorage.setItem('token', token);

      const userRes = await api.get('/permission/user');
      const user = userRes.data;

      login(token, user);
      toast.success("Successfully logged in!");
    } catch (error: any) {
      console.error("Login Error:", error);
      toast.error(error.response?.data?.message || "Invalid credentials. Please try again.");
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-slate-200">
      <CardHeader className="space-y-3 pb-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <Clock className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
        <CardDescription className="text-slate-500">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="Enter your email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-slate-200 focus-visible:ring-blue-600"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-slate-200 focus-visible:ring-blue-600"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pb-8">
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
              Contact Admin
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
