import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DownloadSimple, Trash } from 'phosphor-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

export function DataExportDelete() {
  const { user } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    if (!user?.id) {
      toast.error('User not authenticated.');
      setIsExporting(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drivemy-data-${user?.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully.');
    } catch (err) {
      toast.error('Failed to export data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure? This action cannot be undone.')) return;
    setIsDeleting(true);
    try {
      // Typically account deletion must be handled via an Edge Function using the Service Role Key
      // as Supabase prevents users from deleting their own auth.users record via the client API.
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      await supabase.auth.signOut();
      toast.success('Account deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <h3 className="font-heading font-semibold text-lg">Data & Privacy</h3>
      <p className="text-sm text-muted-foreground">Manage your data in accordance with GDPR/PDPA compliance.</p>
      
      <div className="flex gap-4">
        <Button variant="outline" onClick={handleExportData} disabled={isExporting} className="gap-2">
          <DownloadSimple /> Export My Data
        </Button>
        <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting} className="gap-2">
          <Trash /> Delete Account
        </Button>
      </div>
    </div>
  );
}
