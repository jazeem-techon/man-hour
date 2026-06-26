import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchWhatsAppStatus, logoutWhatsApp } from '@/api/manhourTrackerApi';
import { Loader2, RefreshCcw, CheckCircle2, MessageSquare, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPage() {
  const [status, setStatus] = useState<string>('INITIALIZING');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await fetchWhatsAppStatus();
      setStatus(res.status);
      setQrDataUrl(res.qrDataUrl);
    } catch (error) {
      console.error('Failed to load WhatsApp status', error);
      toast.error('Failed to connect to backend service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(() => {
      if (status !== 'AUTHENTICATED') {
        loadStatus();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutWhatsApp();
      toast.success('WhatsApp session logged out. Generating new QR code...');
      await loadStatus();
    } catch (error) {
      toast.error('Failed to logout.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-muted-foreground">Manage application settings and integrations.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="flex items-center text-green-700">
            <MessageSquare className="mr-2 h-5 w-5" />
            WhatsApp Integration
          </CardTitle>
          <CardDescription>
            Connect a WhatsApp account to allow the system to send automated group messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
            {isLoading ? (
              <div className="flex flex-col items-center space-y-4 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Connecting to WhatsApp service...</p>
              </div>
            ) : status === 'AUTHENTICATED' ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-900">WhatsApp is Connected</h3>
                  <p className="text-sm text-slate-500 max-w-md mt-1">
                    Your WhatsApp account is active and ready to send messages. 
                    You don't need to do anything else.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  Disconnect Account
                </Button>
              </div>
            ) : status === 'QR_READY' && qrDataUrl ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-900">Link WhatsApp Device</h3>
                  <ol className="text-sm text-slate-600 text-left list-decimal list-inside mt-4 space-y-2 max-w-sm">
                    <li>Open WhatsApp on your phone</li>
                    <li>Tap Menu or Settings and select <strong>Linked Devices</strong></li>
                    <li>Tap on <strong>Link a Device</strong></li>
                    <li>Point your phone to this screen to capture the code</li>
                  </ol>
                </div>
                
                <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                  <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-64 h-64" />
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <Button variant="ghost" onClick={loadStatus} className="text-slate-500">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Refresh QR Code
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                    Reset Session
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Initializing WhatsApp client... Please wait.</p>
                <div className="flex space-x-4 mt-6">
                  <Button variant="outline" onClick={loadStatus}>
                    <RefreshCcw className="mr-2 h-4 w-4" /> Check Status
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                    Force Reset
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
