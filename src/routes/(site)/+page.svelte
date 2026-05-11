<script lang="ts">
	import HomepageIcon from '$lib/components/HomepageIcon.svelte';
	import MusicPlayer from '$lib/components/MusicPlayer.svelte';

	let { data } = $props();

	const settings = $derived(data.siteSettings);
	const tracks = $derived(settings?.playlist ?? []);
</script>

<section class="home">
	<div class="center">
		<HomepageIcon
			iconDefault={settings?.themeIconDefault}
			iconAlt={settings?.themeIconAlt}
		/>
	</div>

	<div class="player-slot">
		<MusicPlayer {tracks} />
	</div>
</section>

<style>
	.home {
		position: relative;
		width: 100%;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.center {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.player-slot {
		position: fixed;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 30;
	}
</style>
