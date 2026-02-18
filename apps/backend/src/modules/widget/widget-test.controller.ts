import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';

@Controller('widget-test')
export class WidgetTestController {
  @Public()
  @Get()
  getTestPage(@Res() res: Response) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teste Widget - Chat Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container {
      max-width: 600px;
      width: 100%;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    h1 { font-size: 2.5rem; margin-bottom: 20px; font-weight: 800; }
    p { font-size: 1.1rem; line-height: 1.6; opacity: 0.9; margin-bottom: 15px; }
    .status {
      background: rgba(255, 255, 255, 0.2);
      padding: 20px;
      border-radius: 12px;
      margin-top: 30px;
    }
    .status h2 { font-size: 1.2rem; margin-bottom: 10px; }
    code {
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Widget de Chat</h1>
    <p>Esta é uma página de teste do widget de chat. O botão deve aparecer no canto inferior direito.</p>
    <div class="status">
      <h2>Status</h2>
      <p>Widget Key: <code>81e5dc6c-e247-43f0-9d0c-de189858470f</code></p>
      <p>Server: <code>http://localhost:3001</code></p>
      <p>Script: <code>/api/widget/widget.js</code></p>
    </div>
    <p style="margin-top: 24px;">
      <strong>Instruções:</strong><br>
      1. Procure pelo botão de chat no canto inferior direito<br>
      2. Clique para abrir o widget e testar
    </p>
  </div>

  <script>
    window.ChatWidget = {
      key: '81e5dc6c-e247-43f0-9d0c-de189858470f',
      serverUrl: 'http://localhost:3001'
    };
  </script>
  <script src="/api/widget/widget.js"></script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
