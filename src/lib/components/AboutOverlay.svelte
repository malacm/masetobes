<script lang="ts">
	import { aboutOverlay } from '$lib/stores/aboutOverlay.svelte';
	import PortableText from './PortableText.svelte';
	import ContactForm from './ContactForm.svelte';
	import AccentMark from './portable/AccentMark.svelte';
	import LinkMark from './portable/LinkMark.svelte';
	import { frost, reveal } from '$lib/animations/frost';
	import type { PortableTextComponents } from '@portabletext/svelte';
	import type { PortableTextBlock } from '@portabletext/types';

	type Props = {
		content?: PortableTextBlock[];
		contactEmail?: string;
	};

	const { content, contactEmail }: Props = $props();

	const bioComponents: PortableTextComponents = {
		marks: { accent: AccentMark, link: LinkMark }
	};

	function handleEmailClick(e: MouseEvent) {
		e.preventDefault();
		aboutOverlay.showForm();
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') aboutOverlay.hide();
	}

	/* The bio sits on top of the glass and would otherwise swallow clicks, so a
	   click on it that is not on a link closes the overlay just as the glass
	   does. A click that ends a text selection is left alone — copying the
	   email address should not dismiss the page. */
	function handleBioClick(e: MouseEvent) {
		if ((e.target as Element).closest('a')) return;
		if (window.getSelection()?.toString()) return;
		aboutOverlay.hide();
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if aboutOverlay.open}
	<div class="overlay-root">
		<!-- Frosts in and clears out like the page veil; see frost.ts. The block
		     stays mounted until both outros finish. -->
		<button
			class="backdrop"
			type="button"
			aria-label="Close about overlay"
			onclick={() => aboutOverlay.hide()}
			in:frost
			out:frost
		></button>
		<!-- Lenis drives the window scroll; this panel scrolls itself, so it opts
		     out and keeps native overflow. -->
		<div
			class="panel"
			data-lenis-prevent
			role="dialog"
			aria-modal="true"
			aria-label="About"
			tabindex="-1"
			in:reveal
			out:reveal
		>
			{#if aboutOverlay.view === 'form'}
				<ContactForm fallbackEmail={contactEmail} />
			{:else}
				<!-- Pointer convenience only: keyboard users have Escape and the
				     backdrop button, so no key handler or role is needed here. -->
				<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
				<div class="bio" onclick={handleBioClick}>
					<PortableText value={content} components={bioComponents} />
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
		background: var(--overlay-bg);
		/* prefixed first — see the note on --pill-blur in tokens.css */
		-webkit-backdrop-filter: blur(var(--overlay-blur));
		backdrop-filter: blur(var(--overlay-blur));
		border: 0;
		padding: 0;
		cursor: pointer;
	}

	.panel {
		position: absolute;
		inset: 0;
		overflow-y: auto;
		padding: var(--page-pad-y) var(--page-pad-x);
		pointer-events: none;
	}

	.bio,
	:global(.panel .contact-form) {
		pointer-events: auto;
	}

	:global(.panel .contact-form) {
		max-width: 720px;
	}

	.bio {
		font-size: 1.6rem; /* 32px */
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: var(--track-tight);
		color: var(--fg);
	}

	/* Blocks are separated by a blank line in the design, so the gap is one
	   line of leading rather than an arbitrary pixel value. */
	.bio :global(p) {
		margin-bottom: 1.1em;
	}

	.bio :global(ul) {
		display: flex;
		flex-direction: column;
		margin-bottom: 1.1em;
	}

	.bio :global(li)::before {
		content: '• ';
	}

	.email-link {
		color: var(--accent-link);
	}

	.contact {
		margin-bottom: 0;
	}

	@media (max-width: 768px) {
		.bio {
			font-size: 1rem; /* 20px */
		}
	}
</style>
