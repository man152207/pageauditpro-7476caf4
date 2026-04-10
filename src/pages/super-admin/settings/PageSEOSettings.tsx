import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PageSEORow {
  id: string;
  route: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  og_image: string | null;
  seo_content: string | null;
  schema_type: string | null;
}

export default function PageSEOSettings() {
  const [pages, setPages] = useState<PageSEORow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PageSEORow>>({});

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data } = await supabase.from('page_seo').select('*').order('route');
    setPages(data || []);
    setLoading(false);
  };

  const startEdit = (page: PageSEORow) => {
    setEditingId(page.id);
    setEditForm({ ...page });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { error } = await supabase
      .from('page_seo')
      .update({
        title: editForm.title,
        description: editForm.description,
        keywords: editForm.keywords,
        og_image: editForm.og_image,
        seo_content: editForm.seo_content,
        schema_type: editForm.schema_type,
      })
      .eq('id', editingId);

    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'SEO settings saved' });
      await fetchPages();
      cancelEdit();
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Per-Page SEO Settings</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Edit title, description, keywords, and SEO content for each marketing page.
      </p>

      <div className="space-y-4">
        {pages.map((page) => (
          <div key={page.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{page.route}</code>
              {editingId === page.id ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                  <Button size="sm" onClick={saveEdit} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => startEdit(page)}>Edit</Button>
              )}
            </div>

            {editingId === page.id ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={2}
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Keywords</label>
                  <Input
                    value={editForm.keywords || ''}
                    onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">OG Image URL</label>
                  <Input
                    value={editForm.og_image || ''}
                    onChange={(e) => setEditForm({ ...editForm, og_image: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">SEO Content (shown on page)</label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={4}
                    value={editForm.seo_content || ''}
                    onChange={(e) => setEditForm({ ...editForm, seo_content: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{page.title || '(No title)'}</p>
                <p className="line-clamp-1">{page.description || '(No description)'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
