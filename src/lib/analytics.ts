type EventName = 
  | 'scan_success' 
  | 'scan_failed' 
  | 'scan_item_rejected'
  | 'smart_suggestions_requested'
  | 'smart_suggestions_generated'
  | 'smart_suggestion_action'
  | 'added_ingeredient_db'
  | 'manual_entry'
  | 'model_trained';

export const trackEvent = (eventName: EventName, params?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    // Log to console for verification during development
    console.log(`[Analytics] Event: ${eventName}`, params);

    // Send to Google Analytics if gtag is initialized
    if ((window as any).gtag) {
      (window as any).gtag('event', eventName, params);
    }
  }
};