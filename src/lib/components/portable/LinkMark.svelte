<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MarkComponentProps } from '@portabletext/svelte';
	import type { PortableTextMarkDefinition } from '@portabletext/types';

	type LinkMark = PortableTextMarkDefinition & { href?: string };
	type Props = { portableText: MarkComponentProps<LinkMark>; children?: Snippet };

	const { portableText, children }: Props = $props();

	const href = $derived(portableText.value?.href ?? '#');
	const external = $derived(/^https?:/i.test(href));
</script>

<!--
  @portabletext/svelte ships no default component for the `link` annotation —
  unknown marks render their children bare — so an annotated link in Sanity was
  coming out as plain text and the existing `a.inline-link` rule never matched.
-->
<a
	class="inline-link"
	{href}
	target={external ? '_blank' : undefined}
	rel={external ? 'noreferrer noopener' : undefined}
>{@render children?.()}</a>

<style>
	.inline-link {
		color: var(--accent-link);
	}
</style>
