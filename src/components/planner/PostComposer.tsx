import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Send, Save } from "lucide-react";

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
  const [content, setContent] = useState(editPost?.content || "");
  const [connectionId, setConnectionId] = useState(editPost?.fb_connection_id || "");
  const [scheduledDate, setScheduledDate] = useState(
    editPost?.scheduled_at
      ? new Date(editPost.scheduled_at).toISOString().slice(0, 16)
      : initialDate
      ? new Date(initialDate.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16)
      : ""
  );

  const handleSubmit = (status: "draft" | "scheduled") => {
    onSubmit({
      content,
      fb_connection_id: connectionId || undefined,
      scheduled_at: status === "scheduled" && scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
      status,
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
              disabled={isSubmitting || !content.trim()}
            >
              <Save className="h-4 w-4 mr-1" /> Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit("scheduled")}
              disabled={isSubmitting || !content.trim() || !scheduledDate || !connectionId}
            >
              <Send className="h-4 w-4 mr-1" /> Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
