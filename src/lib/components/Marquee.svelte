<script lang="ts">
	type Props = {
		text: string;
		duration?: number;
	};

	const { text, duration = 18 }: Props = $props();
</script>

<!--
  Placeholder marquee — uses CSS keyframes so the layout doesn't look broken
  before the GSAP animation pass replaces it.
-->
<div class="marquee" style:--duration="{duration}s">
	<div class="track">
		<span>{text}</span>
		<span aria-hidden="true">{text}</span>
	</div>
</div>

<style>
	.marquee {
		overflow: hidden;
		white-space: nowrap;
		max-width: 100%;
	}

	.track {
		display: inline-flex;
		gap: 2em;
		animation: scroll var(--duration) linear infinite;
	}

	@keyframes scroll {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(-50%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.track {
			animation: none;
		}
	}
</style>
