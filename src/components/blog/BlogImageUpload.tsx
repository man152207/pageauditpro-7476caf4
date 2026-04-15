import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BlogImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function BlogImageUpload({ value, onChange }: BlogImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be under 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, file, { cacheControl: '31536000', upsert: false });

    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } else {
      const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(fileName);
      onChange(urlData.publicUrl);
      toast({ title: 'Image uploaded' });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Cover Image</label>
      {value ? (
        <div className="relative">
          <img src={value} alt="Cover" className="w-full h-40 object-cover rounded-lg border border-border" />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => onChange(null)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload image</span>
              <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</span>
            </>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <div className="flex items-center gap-2">
        <Input
          placeholder="Or paste image URL"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="text-xs"
        />
      </div>
    </div>
  );
}
