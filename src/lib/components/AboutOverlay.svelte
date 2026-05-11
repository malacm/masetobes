<script lang="ts">
	import { aboutOverlay } from '$lib/stores/aboutOverlay.svelte';
	import PortableText from './PortableText.svelte';
	import ContactForm from './ContactForm.svelte';
	import type { PortableTextBlock } from '@portabletext/types';

	type Props = {
		content?: PortableTextBlock[];
		contactEmail?: string;
	};

	const { content, contactEmail }: Props = $props();

	function handleEmailClick(e: MouseEvent) {
		e.preventDefault();
		aboutOverlay.showForm();
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') aboutOverlay.hide();
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if aboutOverlay.open}
	<div class="overlay-root">
		<button
			class="backdrop"
			type="button"
			aria-label="Close about overlay"
			onclick={() => aboutOverlay.hide()}
		></button>
		<div class="panel" role="dialog" aria-modal="true" aria-label="About" tabindex="-1">
			{#if aboutOverlay.view === 'form'}
				<ContactForm />
			{:else}
				<div class="bio">
					<PortableText value={content} />
					{#if contactEmail}
						<p class="contact">
							Contact:
							<a class="email-link" href={`mailto:${contactEmail}`} onclick={handleEmailClick}>
								{contactEmail}
							</a>
						</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.overlay-root {
		position: fixed;
		inset: 0;
		z-index: 100;
	}

	.backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 0;
		padding: 0;
		cursor: pointer;
	}

	.panel {
		position: absolute;
		inset: 0;
		overflow-y: auto;
		padding: 64px var(--page-pad-x);
		pointer-events: none;
	}

	.bio,
	:global(.panel .contact-form) {
		pointer-events: auto;
		max-width: 720px;
	}

	.bio {
		font-size: 24px;
		font-weight: 600;
		color: var(--fg);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.bio :global(p) {
		margin-bottom: 12px;
	}

	.bio :global(ul) {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.bio :global(li)::before {
		content: '• ';
	}

	.bio :global(a.inline-link),
	.email-link {
		color: var(--accent-link);
	}

	.contact {
		margin-top: 12px;
	}
</style>
