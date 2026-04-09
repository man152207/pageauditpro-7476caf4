import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Send, Save, ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FBConnection {
  id: string;
  page_name: string;
}

interface PostComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (post: {
    content: string;
    fb_connection_id?: string;
    scheduled_at?: string;
    status: string;
    media_urls?: string[];
  }) => void;
  connections: FBConnection[];
  isSubmitting?: boolean;
  initialDate?: Date;
  editPost?: {
    id: string;
    content: string;
    fb_connection_id: string | null;
    scheduled_at: string | null;
    status: string;
    media_urls?: string[] | null;
  } | null;
}

export function PostComposer({
  open,
  onOpenChange,
  onSubmit,
  connections,
  isSubmitting,
  initialDate,
  editPost,
}: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens or editPost changes
  useEffect(() => {
    if (open) {
      setContent(editPost?.content || "");
      setConnectionId(editPost?.fb_connection_id || "");
      setMediaUrls(editPost?.media_urls || []);
      if (editPost?.scheduled_at) {
        setScheduledDate(new Date(editPost.scheduled_at).toISOString().slice(0, 16));
      } else if (initialDate) {
        setScheduledDate(new Date(initialDate.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16));
      } else {
        setScheduledDate("");
      }
    }
  }, [open, editPost?.id, initialDate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("post-media").upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("post-media").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      setMediaUrls((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (status: "draft" | "scheduled") => {
    onSubmit({
      content,
      fb_connection_id: connectionId || undefined,
      scheduled_at: status === "scheduled" && scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      status,
      media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {editPost ? "Edit Post" : "Create Post"}
          </DialogTitle>
          <DialogDescription>
            {editPost ? "Update your scheduled post details." : "Create a new post to schedule or save as draft."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="connection">Facebook Page</Label>
            <Select value={connectionId} onValueChange={setConnectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a page" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.page_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Post Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
          </div>

          {/* Image Upload */}
          <div>
            <Label className="flex items-center gap-1 mb-2">
              <ImagePlus className="h-3.5 w-3.5" /> Images
            </Label>
            {mediaUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="relative group w-16 h-16 rounded-md overflow-hidden border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ImagePlus className="h-4 w-4 mr-1" />}
              {uploading ? "Uploading..." : "Add Images"}
            </Button>
          </div>

          <div>
            <Label htmlFor="schedule" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Schedule Date & Time
            </Label>
            <Input
              id="schedule"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting || !content.trim() || uploading}
            >
              <Save className="h-4 w-4 mr-1" /> Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit("scheduled")}
              disabled={isSubmitting || !content.trim() || !scheduledDate || !connectionId || uploading}
            >
              <Send className="h-4 w-4 mr-1" /> Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
