import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Gift, Loader2, Plus, Trash2, Search, Users, Infinity } from 'lucide-react';
import { format, startOfMonth, addMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const LIFETIME_SENTINEL = '9999-01-01';

interface FreeAuditGrant {
  id: string;
  user_id: string;
  granted_by: string;
  grant_month: string;
  created_at: string;
  user_email?: string;
}

interface UserSearchResult {
  id: string;
  email: string;
  full_name: string | null;
}

export default function PromotionsSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [grants, setGrants] = useState<FreeAuditGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Generate month options (current month + next 12 months) + Lifetime
  const monthOptions = [
    { value: LIFETIME_SENTINEL, label: '♾️ Lifetime' },
    ...Array.from({ length: 13 }, (_, i) => {
      const date = addMonths(startOfMonth(new Date()), i);
      return {
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'MMMM yyyy'),
      };
    }),
  ];

  const getGrantLabel = (grantMonth: string) => {
    if (grantMonth === LIFETIME_SENTINEL) return 'Lifetime';
    try {
      return format(new Date(grantMonth), 'MMMM yyyy');
    } catch {
      return grantMonth;
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
    try {
      const { data: grantsData, error } = await supabase
        .from('free_audit_grants')
        .select('*')
        .order('grant_month', { ascending: false });

      if (error) throw error;

      if (grantsData && grantsData.length > 0) {
        const userIds = [...new Set(grantsData.map(g => g.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email')
          .in('user_id', userIds);

        const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
        
        const grantsWithEmail = grantsData.map(g => ({
          ...g,
          user_email: emailMap.get(g.user_id) || 'Unknown',
        }));

        setGrants(grantsWithEmail);
      } else {
        setGrants([]);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .ilike('email', `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data?.map(p => ({
        id: p.user_id, email: p.email || '', full_name: p.full_name,
      })) || []);
    } catch (error: any) {
      toast({ title: 'Search Failed', description: error.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleGrantFreeAudits = async () => {
    if (!selectedUser || !selectedMonth) {
      toast({ title: 'Missing Information', description: 'Please select a user and month.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('free_audit_grants')
        .insert({
          user_id: selectedUser.id,
          granted_by: user?.id,
          grant_month: selectedMonth,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('This user already has free audits for this period.');
        }
        throw error;
      }

      const periodLabel = selectedMonth === LIFETIME_SENTINEL
        ? 'Lifetime access'
        : monthOptions.find(m => m.value === selectedMonth)?.label || selectedMonth;

      toast({
        title: 'Grant Created',
        description: `${selectedUser.email} now has free audits — ${periodLabel}.`,
      });

      setSelectedUser(null);
      setSelectedMonth('');
      setSearchQuery('');
      setSearchResults([]);
      await fetchGrants();
    } catch (error: any) {
      toast({ title: 'Failed to Create Grant', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGrant = async (grantId: string) => {
    try {
      const { error } = await supabase.from('free_audit_grants').delete().eq('id', grantId);
      if (error) throw error;
      toast({ title: 'Grant Removed', description: 'The free audit grant has been removed.' });
      await fetchGrants();
    } catch (error: any) {
      toast({ title: 'Failed to Remove', description: error.message, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Grant Free Audits
          </CardTitle>
          <CardDescription>
            Give a user unlimited free audits for a specific month or lifetime. This is a hidden feature not visible to regular users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Search User by Email</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="user@example.com"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && !selectedUser && (
            <div className="border rounded-lg divide-y max-h-48 overflow-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => { setSelectedUser(result); setSearchResults([]); }}
                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{result.email}</p>
                    {result.full_name && <p className="text-sm text-muted-foreground">{result.full_name}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">{selectedUser.email}</p>
                  {selectedUser.full_name && <p className="text-sm text-muted-foreground">{selectedUser.full_name}</p>}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>Change</Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Free Audit Period</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select period..." />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGrantFreeAudits} disabled={!selectedUser || !selectedMonth || saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Grant Free Audits
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Grants</CardTitle>
          <CardDescription>Users with free audit access for specific months or lifetime.</CardDescription>
        </CardHeader>
        <CardContent>
          {grants.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active grants. Use the form above to grant free audits.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grants.map((grant) => (
                  <TableRow key={grant.id}>
                    <TableCell className="font-medium">{grant.user_email}</TableCell>
                    <TableCell>
                      {grant.grant_month === LIFETIME_SENTINEL ? (
                        <Badge variant="default" className="gap-1">
                          <Infinity className="h-3 w-3" /> Lifetime
                        </Badge>
                      ) : (
                        getGrantLabel(grant.grant_month)
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(grant.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGrant(grant.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
