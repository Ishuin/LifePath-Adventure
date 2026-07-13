import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
// `base` is set to the repository name for production builds so that asset
// URLs resolve correctly when the site is served from a GitHub Pages project
// subpath (https://<user>.github.io/LifePath-Adventure/). Local dev keeps '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/LifePath-Adventure/' : '/',
  plugins: [react()],
}))
