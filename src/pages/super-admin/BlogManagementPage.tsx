import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Save, Trash2, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author: string | null;
  tags: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

const emptyPost: Omit<BlogPost, 'id' | 'created_at'> = {
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  cover_image: '',
  author: 'Pagelyzer Team',
  tags: [],
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  published: false,
  published_at: null,
};

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const startNew = () => {
    setEditingPost({ ...emptyPost });
    setIsNew(true);
  };

  const startEdit = (post: BlogPost) => {
    setEditingPost({ ...post });
    setIsNew(false);
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setIsNew(false);
  };

  const save = async () => {
    if (!editingPost?.title || !editingPost?.slug || !editingPost?.content) {
      toast({ title: 'Title, slug, and content are required', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const payload = {
      slug: editingPost.slug,
      title: editingPost.title,
      excerpt: editingPost.excerpt || null,
      content: editingPost.content,
      cover_image: editingPost.cover_image || null,
      author: editingPost.author || 'Pagelyzer Team',
      tags: editingPost.tags || [],
      meta_title: editingPost.meta_title || null,
      meta_description: editingPost.meta_description || null,
      meta_keywords: editingPost.meta_keywords || null,
      published: editingPost.published || false,
      published_at: editingPost.published ? (editingPost.published_at || new Date().toISOString()) : null,
    };

    let error;
    if (isNew) {
      ({ error } = await supabase.from('blog_posts').insert(payload));
    } else {
      ({ error } = await supabase.from('blog_posts').update(payload).eq('id', editingPost.id!));
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isNew ? 'Post created' : 'Post updated' });
      await fetchPosts();
      cancelEdit();
    }
    setSaving(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Post deleted' });
      fetchPosts();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (editingPost) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{isNew ? 'New Blog Post' : 'Edit Blog Post'}</h2>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Title *</label>
              <Input value={editingPost.title || ''} onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Slug *</label>
              <Input value={editingPost.slug || ''} onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Excerpt</label>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2}
              value={editingPost.excerpt || ''} onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Content *</label>
            <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" rows={12}
              value={editingPost.content || ''} onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cover Image URL</label>
              <Input value={editingPost.cover_image || ''} onChange={(e) => setEditingPost({ ...editingPost, cover_image: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Author</label>
              <Input value={editingPost.author || ''} onChange={(e) => setEditingPost({ ...editingPost, author: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Tags (comma-separated)</label>
            <Input value={(editingPost.tags || []).join(', ')}
              onChange={(e) => setEditingPost({ ...editingPost, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} />
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-bold mb-3">SEO Meta</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Meta Title</label>
                <Input value={editingPost.meta_title || ''} onChange={(e) => setEditingPost({ ...editingPost, meta_title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Meta Description</label>
                <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={2}
                  value={editingPost.meta_description || ''} onChange={(e) => setEditingPost({ ...editingPost, meta_description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Meta Keywords</label>
                <Input value={editingPost.meta_keywords || ''} onChange={(e) => setEditingPost({ ...editingPost, meta_keywords: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t pt-4">
            <Switch checked={editingPost.published || false}
              onCheckedChange={(checked) => setEditingPost({ ...editingPost, published: checked })} />
            <label className="text-sm font-medium">Published</label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Blog Management</h2>
        </div>
        <Button onClick={startNew}>
          <Plus className="h-4 w-4 mr-1" /> New Post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No blog posts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{post.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${post.published ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">/{post.slug}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button size="sm" variant="outline" onClick={() => startEdit(post)}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePost(post.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
