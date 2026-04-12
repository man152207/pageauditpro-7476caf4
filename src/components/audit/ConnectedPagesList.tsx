import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Facebook, PlayCircle, Trash2, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

interface FBConnection {
  id: string;
  page_id: string;
  page_name: string;
  is_active: boolean;
  connected_at: string;
  token_expires_at?: string | null;
}

interface ConnectedPagesListProps {
  connections: FBConnection[];
  onRunAudit: (connection: FBConnection) => void;
  onDisconnect: (connection: FBConnection) => void;
  onReconnect?: () => void;
  runningAuditId: string | null;
  disconnectingId: string | null;
}

function isTokenExpired(connection: FBConnection): boolean {
  if (!connection.token_expires_at) return false; // unknown = assume ok
  return new Date(connection.token_expires_at).getTime() < Date.now();
}

export function ConnectedPagesList({
  connections,
  onRunAudit,
  onDisconnect,
  onReconnect,
  runningAuditId,
  disconnectingId,
}: ConnectedPagesListProps) {
  if (connections.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Page</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Connected</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connections.map((conn) => {
            const expired = isTokenExpired(conn);
            return (
              <TableRow key={conn.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1877F2] text-white shrink-0">
                      <Facebook className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{conn.page_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {expired ? (
                    <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Token Expired
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-success border-success/30 bg-success/10">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Connected
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(conn.connected_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {expired ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-600 border-amber-300 hover:bg-amber-50"
                        onClick={onReconnect}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onRunAudit(conn)}
                        disabled={runningAuditId === conn.id}
                      >
                        {runningAuditId === conn.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Run Audit
                          </>
                        )}
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={disconnectingId === conn.id}
                        >
                          {disconnectingId === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect Page?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove <strong>{conn.page_name}</strong> from your connected pages.
                            You can reconnect it later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDisconnect(conn)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
