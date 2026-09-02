<script lang="ts">
	import { page } from '$app/state';
	import { aboutOverlay } from '$lib/stores/aboutOverlay.svelte';

	type Props = {
		name?: string;
	};

	const { name = 'Mason Tobia' }: Props = $props();

	function handleAboutClick(e: MouseEvent) {
		e.preventDefault();
		aboutOverlay.toggle();
	}

	const isActive = $derived((href: string) => {
		const path = page.url.pathname;
		if (href === '/work') return path === '/work' || path.startsWith('/work/');
		return path === href;
	});
</script>

<nav class="nav">
	<a class="name" class:concealed={aboutOverlay.open} href="/">{name}</a>

	<ul class="links">
		<li>
			<a class="pill" class:active={isActive('/work')} href="/work">
				<span class="pill-text">work</span>
			</a>
		</li>
		<li>
			<a class="pill" class:active={isActive('/personal')} href="/personal">
				<span class="pill-text">personal</span>
			</a>
		</li>
		<li>
			<button
				class="pill"
				class:active={aboutOverlay.open}
				type="button"
				onclick={handleAboutClick}
			>
				<span class="pill-text">about</span>
			</button>
		</li>
	</ul>
</nav>

<style>
	.nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 50;
		display: flex;
		justify-content: space-between;
		/* Name and pills sit on a shared baseline in the desktop frame. */
		align-items: flex-end;
		padding: var(--nav-pad-y) var(--nav-pad-x);
		pointer-events: none;
	}

	.name,
	.links {
		pointer-events: auto;
	}

	.name {
		font-weight: 700;
		font-size: 1.6rem; /* 32px at 20px base */
		line-height: 1.1;
		letter-spacing: var(--track-tight);
		color: var(--fg);
		/* Fades out as the about overlay frosts in and back as it clears, on the
		   overlay's own clock (see src/lib/animations/frost.ts). `visibility` is
		   held until the fade has finished so the hidden name never takes focus. */
		transition:
			opacity 520ms cubic-bezier(0.22, 1, 0.36, 1),
			visibility 0s;
	}

	.name.concealed {
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 380ms cubic-bezier(0.6, 0, 0.35, 1),
			visibility 0s 380ms;
	}

	@media (prefers-reduced-motion: reduce) {
		.name,
		.name.concealed {
			transition: none;
		}
	}

	.links {
		display: flex;
		gap: var(--pill-gap);
		align-items: center;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 30px;
		padding: 0 var(--pill-pad-x);
		border-radius: var(--pill-radius);
		background: var(--pill-bg);
		/* prefixed first — see the note on --pill-blur in tokens.css */
		-webkit-backdrop-filter: blur(var(--pill-blur));
		backdrop-filter: blur(var(--pill-blur));
		color: var(--pill-fg);
		font-weight: 700;
		font-size: 1rem; /* 20px */
		line-height: normal;
		letter-spacing: var(--track-tight);
	}

	.pill-text {
		display: inline-block;
		transition: filter 180ms ease;
	}

	.pill:hover .pill-text,
	.pill.active .pill-text {
		filter: blur(var(--text-blur));
	}

	@media (max-width: 768px) {
		.nav {
			align-items: center;
		}

		.name {
			font-size: 1rem; /* 20px */
		}

		.pill {
			height: 21px;
			font-size: 0.7rem; /* 14px */
		}
	}
</style>
