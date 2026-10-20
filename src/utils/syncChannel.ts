// Real-time synchronization across browser tabs and windows
export type SyncEvent =
  | { type: 'ASSIGNMENT_DELETED'; assignmentId: string }
  | { type: 'ASSIGNMENT_SAVED'; assignmentId: string };

const CHANNEL_NAME = 'eduhomework_realtime_sync';

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (err) {
    console.warn('BroadcastChannel not supported or failed to initialize', err);
  }
}

export function broadcastSyncEvent(event: SyncEvent): void {
  try {
    channel?.postMessage(event);
  } catch (e) {
    console.warn('Failed to broadcast sync event', e);
  }
}

export function subscribeToSyncEvents(onEvent: (event: SyncEvent) => void): () => void {
  if (!channel) return () => {};
  const handler = (e: MessageEvent<SyncEvent>) => {
    if (e.data && e.data.type) {
      onEvent(e.data);
    }
  };
  channel.addEventListener('message', handler);
  return () => {
    channel?.removeEventListener('message', handler);
  };
}
