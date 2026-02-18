export function getWidgetCSS(primaryColor = '#6366f1', position = 'bottom-right'): string {
  const isRight = position === 'bottom-right';
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    #cw-launcher-container {
      position: fixed;
      ${isRight ? 'right: 24px' : 'left: 24px'};
      bottom: 24px;
      display: flex;
      flex-direction: column;
      align-items: ${isRight ? 'flex-end' : 'flex-start'};
      gap: 12px;
      z-index: 2147483647;
    }

    #cw-balloon {
      background: white;
      padding: 10px 16px;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      font-family: -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      border: 1px solid #f3f4f6;
      white-space: nowrap;
      animation: cw-fade-in 0.3s ease;
      cursor: pointer;
      pointer-events: auto;
    }
    #cw-balloon.hidden { display: none; }

    #cw-launcher {
      width: 56px;
      height: 56px;
      border-radius: 18px;
      background: ${primaryColor};
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    #cw-launcher:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(0,0,0,0.25);
    }
    #cw-launcher svg {
      width: 28px;
      height: 28px;
      fill: white;
    }

    #cw-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 20px;
      height: 20px;
      background: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
      font-size: 10px;
      color: white;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, sans-serif;
    }
    #cw-badge.hidden { display: none; }

    #cw-frame {
      position: fixed;
      ${isRight ? 'right: 24px' : 'left: 24px'};
      bottom: 96px;
      width: 360px;
      height: 560px;
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 10px 50px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 2147483646;
      transform-origin: bottom ${isRight ? 'right' : 'left'};
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #cw-frame.hidden {
      transform: scale(0.6) translateY(40px);
      opacity: 0;
      pointer-events: none;
    }

    /* Header */
    #cw-header {
      background: ${primaryColor};
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    #cw-header-avatar {
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.25);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    #cw-header-avatar svg { width: 24px; height: 24px; fill: white; }
    #cw-header-text h3 {
      color: white;
      font-size: 15px;
      font-weight: 700;
    }
    #cw-header-text p {
      color: rgba(255,255,255,0.8);
      font-size: 11px;
      font-weight: 500;
      margin-top: 1px;
    }
    #cw-close {
      margin-left: auto;
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 10px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      transition: background 0.15s;
    }
    #cw-close:hover { background: rgba(255,255,255,0.3); }

    /* Messages */
    #cw-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #fdfdfe;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #cw-messages::-webkit-scrollbar { width: 4px; }
    #cw-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }

    .cw-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 18px;
      font-size: 13.5px;
      line-height: 1.5;
      word-break: break-word;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .cw-msg-agent {
      background: ${primaryColor};
      color: white;
      border-radius: 18px 18px 4px 18px;
      margin-left: auto;
    }
    .cw-msg-contact {
      background: #fff;
      color: #1f2937;
      border: 1px solid #f3f4f6;
      border-radius: 18px 18px 18px 4px;
    }
    .cw-msg-time {
      font-size: 10px;
      margin-top: 4px;
      opacity: 0.6;
    }

    /* Composer */
    #cw-composer {
      padding: 12px 16px;
      background: white;
      border-top: 1px solid #f3f4f6;
      display: flex;
      align-items: flex-end;
      gap: 10px;
      flex-shrink: 0;
    }
    #cw-input {
      flex: 1;
      border: 1px solid #e5e7eb;
      border-radius: 18px;
      padding: 10px 14px;
      font-size: 13px;
      resize: none;
      outline: none;
      font-family: inherit;
      max-height: 120px;
      min-height: 40px;
      background: #f9fafb;
      transition: all 0.2s;
      line-height: 1.5;
    }
    #cw-input:focus { border-color: ${primaryColor}; background: white; box-shadow: 0 0 0 3px ${primaryColor}20; }
    #cw-send {
      width: 40px;
      height: 40px;
      background: ${primaryColor};
      border: none;
      border-radius: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }
    #cw-send:hover:not(:disabled) { transform: scale(1.05); }
    #cw-send:active:not(:disabled) { transform: scale(0.95); }
    #cw-send:disabled { opacity: 0.3; cursor: not-allowed; }
    #cw-send svg { width: 18px; height: 18px; fill: white; }

    /* Identity form */
    #cw-identity {
      flex: 1;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      background: #fff;
    }
    #cw-identity h3 {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 8px;
    }
    #cw-identity p {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 24px;
      line-height: 1.4;
    }
    .cw-field { margin-bottom: 16px; }
    .cw-field label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: #4b5563;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .cw-field input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
      transition: all 0.2s;
    }
    .cw-field input:focus { border-color: ${primaryColor}; box-shadow: 0 0 0 3px ${primaryColor}20; }
    #cw-start-btn {
      width: 100%;
      padding: 14px;
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 12px;
      font-family: inherit;
      transition: all 0.2s;
      box-shadow: 0 4px 12px ${primaryColor}40;
    }
    #cw-start-btn:hover { opacity: 0.95; transform: translateY(-1px); }
    #cw-start-btn:active { transform: translateY(0); }
    #cw-start-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

    /* Guide panel */
    #cw-guide {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      background: #f9fafb;
    }
    #cw-guide.hidden { display: none; }
    #cw-guide-search {
      padding: 12px 16px;
      background: white;
      border-bottom: 1px solid #f3f4f6;
      flex-shrink: 0;
    }
    #cw-guide-search input {
      width: 100%;
      padding: 9px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      font-size: 13px;
      outline: none;
      font-family: inherit;
      background: #f9fafb;
      box-sizing: border-box;
    }
    #cw-guide-search input:focus { border-color: ${primaryColor}; background: white; }
    #cw-guide-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .cw-article {
      background: white;
      border: 1px solid #f3f4f6;
      border-radius: 14px;
      padding: 14px 16px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .cw-article:hover { border-color: ${primaryColor}40; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
    .cw-article-title {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }
    .cw-article-excerpt {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .cw-article-content {
      font-size: 13px;
      color: #374151;
      line-height: 1.6;
      padding-top: 8px;
      border-top: 1px solid #f3f4f6;
      margin-top: 8px;
    }
    .cw-guide-empty {
      text-align: center;
      padding: 40px 20px;
      color: #9ca3af;
      font-size: 13px;
    }
    .cw-guide-back {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: ${primaryColor};
      background: none;
      border: none;
      cursor: pointer;
      margin-bottom: 10px;
      font-family: inherit;
      padding: 0;
      font-weight: 600;
    }

    /* Header guide button */
    #cw-guide-btn {
      margin-left: auto;
      background: rgba(255,255,255,0.2);
      border: none;
      border-radius: 10px;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      transition: background 0.15s;
      margin-right: 4px;
    }
    #cw-guide-btn:hover { background: rgba(255,255,255,0.3); }
    #cw-guide-btn svg { width: 16px; height: 16px; fill: white; }

    /* Pulse animation on launcher when unread */
    #cw-launcher.cw-pulse::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 22px;
      border: 3px solid ${primaryColor};
      animation: cw-pulse-ring 1.5s ease-out infinite;
    }

    @keyframes cw-pulse-ring {
      0% { transform: scale(0.9); opacity: 0.8; }
      100% { transform: scale(1.3); opacity: 0; }
    }

    @keyframes cw-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
}
