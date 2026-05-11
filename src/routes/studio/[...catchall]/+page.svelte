<script lang="ts">
	import { SanityStudio } from '@sanity/sveltekit';
	import config from '../../../../sanity.config';
</script>

<svelte:head>
	<title>Studio · Mason Tobia</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<SanityStudio {config} />
