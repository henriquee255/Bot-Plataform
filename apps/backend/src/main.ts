import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// Prevent unhandled Redis/IORedis errors from crashing the process
process.on('unhandledRejection', (reason) => {
  if (reason && typeof reason === 'object') {
    const msg = (reason as any).message || '';
    if (msg.includes('ECONNREFUSED') || msg.includes('ENETUNREACH') || msg.includes('ENOTFOUND')) {
      console.error('[DB/Redis] Connection error (non-fatal):', msg);
      return;
    }
  }
  console.error('Unhandled rejection:', reason);
});

function startFallbackServer(port: number | string, reason: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const http = require('http');
  const server = http.createServer((_req: any, res: any) => {
    if (_req.url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'starting', reason }));
    } else {
      res.writeHead(503);
      res.end('Service starting...');
    }
  });
  server.listen(port, () => {
    console.log(`[Fallback] HTTP server on port ${port}. Reason: ${reason}`);
  });
}

async function bootstrap() {
  let app: any;
  try {
    app = await NestFactory.create(AppModule);
  } catch (err: any) {
    console.error('[Bootstrap] Failed to initialize NestJS app:', err?.message || err);
    const port = process.env.PORT || 3001;
    startFallbackServer(port, err?.message || 'initialization error');
    return;
  }

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Simple Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Health check endpoint (usado pelo Railway)
  app.use('/api/health', (_req: any, res: any) => res.json({ status: 'ok' }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}/api`);
}

bootstrap();
