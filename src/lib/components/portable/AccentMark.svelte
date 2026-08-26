<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MarkComponentProps } from '@portabletext/svelte';

	type Props = { portableText: MarkComponentProps; children?: Snippet };

	const { children }: Props = $props();
</script>

<!--
  The `accent` decorator: colour only, no destination. The Figma about overlay
  puts "Zero Studios" in the same green as the email, but nothing in the design
  says it links anywhere — so this is a highlight, not a link.
-->
<span class="accent">{@render children?.()}</span>

<style>
	.accent {
		color: var(--accent-link);
	}
</style>
