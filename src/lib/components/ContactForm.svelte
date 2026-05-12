<script lang="ts">
	import { aboutOverlay } from '$lib/stores/aboutOverlay.svelte';

	type Props = {
		fallbackEmail?: string;
	};

	const { fallbackEmail }: Props = $props();

	type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string };

	let status = $state<Status>({ kind: 'idle' });
	let name = $state('');
	let email = $state('');
	let message = $state('');

	function openMailtoFallback() {
		if (!fallbackEmail) return;
		const subject = encodeURIComponent(`Portfolio contact from ${name || 'a visitor'}`);
		const body = encodeURIComponent(`${message}\n\n— ${name}${email ? ` (${email})` : ''}`);
		window.location.href = `mailto:${fallbackEmail}?subject=${subject}&body=${body}`;
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		status = { kind: 'sending' };
		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name, email, message })
			});
			// 503 = email service not configured on the server. Fall back to
			// opening the visitor's mail client with the message pre-filled.
			if (res.status === 503 && fallbackEmail) {
				openMailtoFallback();
				status = { kind: 'idle' };
				return;
			}
			const data = await res.json();
			if (!res.ok || !data.ok) {
				status = { kind: 'error', message: data.error ?? 'Something went wrong.' };
				return;
			}
			status = { kind: 'sent' };
			name = '';
			email = '';
			message = '';
		} catch (err) {
			status = { kind: 'error', message: 'Network error — please try again.' };
		}
	}
</script>

<form class="contact-form" onsubmit={handleSubmit}>
	<button type="button" class="back" onclick={() => aboutOverlay.showBio()}>← back</button>

	<label>
		<span>name</span>
		<input bind:value={name} type="text" required maxlength="120" />
	</label>

	<label>
		<span>email</span>
		<input bind:value={email} type="email" required maxlength="200" />
	</label>

	<label>
		<span>message</span>
		<textarea bind:value={message} rows="6" required maxlength="4000"></textarea>
	</label>

	<button type="submit" class="submit" disabled={status.kind === 'sending'}>
		{status.kind === 'sending' ? 'sending…' : 'send'}
	</button>

	{#if status.kind === 'sent'}
		<p class="status sent">message sent — thanks.</p>
	{:else if status.kind === 'error'}
		<p class="status error">{status.message}</p>
	{/if}
</form>

<style>
	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-width: 520px;
		font-size: 16px;
		color: var(--fg);
	}

	.back {
		align-self: flex-start;
		color: var(--accent-link);
		font-weight: 500;
		padding: 0;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	label span {
		font-weight: 600;
	}

	input,
	textarea {
		background: rgba(0, 0, 0, 0.25);
		color: var(--fg);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 4px;
		padding: 8px 10px;
		resize: vertical;
	}

	input:focus,
	textarea:focus {
		outline: 2px solid var(--accent-link);
		outline-offset: 1px;
	}

	.submit {
		align-self: flex-start;
		padding: 6px 14px;
		border-radius: 8px;
		background: var(--pill-bg);
		color: var(--pill-fg);
		font-weight: 600;
	}

	.submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.status.sent {
		color: var(--accent-link);
	}

	.status.error {
		color: #f7a4a4;
	}
</style>
