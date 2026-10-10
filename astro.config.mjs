import { defineConfig } from 'astro/config';
// SITE_URL and SITE_BASE come from the deploy workflow. For a custom domain, set SITE_URL to it and SITE_BASE to '/'.
export default defineConfig({
  site: process.env.SITE_URL || 'https://sharanstudio.github.io',
  base: process.env.SITE_BASE || '/',
});
