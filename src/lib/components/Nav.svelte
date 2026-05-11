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
	<a class="name" href="/">{name}</a>

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
		align-items: center;
		padding: var(--nav-pad-y) var(--nav-pad-x);
		pointer-events: none;
	}

	.name,
	.links {
		pointer-events: auto;
	}

	.name {
		font-weight: 700;
		font-size: 20px;
		color: var(--fg);
	}

	.links {
		display: flex;
		gap: 8px;
		align-items: center;
	}

	.pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 16px;
		border-radius: 8px;
		background: var(--pill-bg);
		color: var(--pill-fg);
		font-weight: 700;
		font-size: 20px;
		line-height: 1;
	}

	.pill-text {
		display: inline-block;
		transition: filter 180ms ease;
	}

	.pill:hover .pill-text,
	.pill.active .pill-text {
		filter: blur(3px);
	}
</style>
