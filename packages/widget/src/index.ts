import { Widget } from './core/sdk';

interface WidgetGlobal {
  key: string;
  serverUrl?: string;
}

declare global {
  interface Window {
    ChatWidget?: WidgetGlobal;
    _cwInstance?: Widget;
  }
}

let initialized = false;

async function init() {
  if (initialized) return;

  const cfg = window.ChatWidget;
  if (!cfg?.key) {
    if (document.readyState === 'complete') {
      console.warn('[ChatWidget] window.ChatWidget.key is required but not found');
    } else {
      setTimeout(init, 100);
    }
    return;
  }

  // Ensure body exists before injection
  if (!document.body) {
    setTimeout(init, 50);
    return;
  }

  initialized = true;
  console.log('[ChatWidget] Initializing with key:', cfg.key);

  try {
    const widget = new Widget({
      key: cfg.key,
      serverUrl: cfg.serverUrl,
    });

    window._cwInstance = widget;
    await widget.boot();
    console.log('[ChatWidget] Widget booted successfully');
  } catch (err) {
    console.error('[ChatWidget] Initialization error:', err);
    initialized = false;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Global hook to retry if config was added late
(window as any).refreshChatWidget = init;
