import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// GSAP's package ships ES module syntax in a file Node won't treat as
		// ESM (no "type": "module" in its package.json). Bundling it into the
		// SSR output keeps Node from trying to resolve it at runtime.
		noExternal: ['gsap']
	}
});
