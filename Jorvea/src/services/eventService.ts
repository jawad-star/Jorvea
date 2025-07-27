import { EventEmitter } from 'events';

class EventService extends EventEmitter {
  private static instance: EventService;

  private constructor() {
    super();
  }

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  // Emit event when new content is created
  public emitContentCreated(type: 'post' | 'reel') {
    this.emit('contentCreated', { type, timestamp: Date.now() });
  }

  // Listen for content creation events
  public onContentCreated(callback: (data: { type: 'post' | 'reel'; timestamp: number }) => void) {
    this.on('contentCreated', callback);
    return () => this.off('contentCreated', callback);
  }

  // Emit event when content is liked/unliked
  public emitContentInteraction(type: 'like' | 'unlike' | 'share' | 'comment', contentType: 'post' | 'reel', contentId: string) {
    this.emit('contentInteraction', { type, contentType, contentId, timestamp: Date.now() });
  }

  // Listen for content interaction events
  public onContentInteraction(callback: (data: { type: 'like' | 'unlike' | 'share' | 'comment'; contentType: 'post' | 'reel'; contentId: string; timestamp: number }) => void) {
    this.on('contentInteraction', callback);
    return () => this.off('contentInteraction', callback);
  }
}

export const eventService = EventService.getInstance();
