<script lang="ts">
	import HomepageIcon from '$lib/components/HomepageIcon.svelte';

	let { data } = $props();

	const settings = $derived(data.siteSettings);
</script>

<section class="home">
	<div class="center">
		<HomepageIcon
			iconDefault={settings?.themeIconDefault}
			iconAlt={settings?.themeIconAlt}
		/>
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
</style>
