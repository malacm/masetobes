<script lang="ts">
	import { PortableText, type PortableTextComponents } from '@portabletext/svelte';
	import type { PortableTextBlock } from '@portabletext/types';

	type Props = {
		value: PortableTextBlock[] | undefined;
		components?: PortableTextComponents;
	};

	const { value, components }: Props = $props();
</script>

{#if value && value.length > 0}
	<PortableText {value} {components} />
{/if}
