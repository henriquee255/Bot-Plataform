import * as esbuild from 'esbuild';
import { mkdir } from 'fs/promises';

await mkdir('dist', { recursive: true });

const isWatch = process.argv.includes('--watch');

const ctx = await esbuild.context({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/widget.js',
  format: 'iife',
  globalName: 'ChatWidgetSDK',
  minify: !isWatch,
  sourcemap: isWatch,
  target: ['es2018', 'chrome80', 'firefox80', 'safari13'],
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
  banner: {
    js: '/* Chat Widget v1.0.0 */',
  },
});

if (isWatch) {
  await ctx.watch();
  const { host, port } = await ctx.serve({
    servedir: 'dist',
    port: 3002,
  });
  console.log(`Watching and serving at http://localhost:${port}`);
} else {
  await ctx.rebuild();
  await ctx.dispose();
  console.log('Widget built: dist/widget.js');
}
