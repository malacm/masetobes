import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resend, isResendConfigured } from '$lib/server/resend';
import { env } from '$env/dynamic/private';

const { RESEND_FROM_EMAIL, CONTACT_TO_EMAIL } = env;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request }) => {
	if (!isResendConfigured || !resend) {
		return json({ ok: false, error: 'Email service not configured.' }, { status: 503 });
	}
	if (!CONTACT_TO_EMAIL) {
		return json({ ok: false, error: 'Contact destination not configured.' }, { status: 503 });
	}

	let payload: { name?: string; email?: string; message?: string };
	try {
		payload = await request.json();
	} catch {
		return json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
	}

	const name = payload.name?.trim() ?? '';
	const email = payload.email?.trim() ?? '';
	const message = payload.message?.trim() ?? '';

	if (!name || name.length > 120) return json({ ok: false, error: 'Name is required.' }, { status: 400 });
	if (!EMAIL_RE.test(email) || email.length > 200) return json({ ok: false, error: 'Valid email is required.' }, { status: 400 });
	if (!message || message.length < 4 || message.length > 4000) return json({ ok: false, error: 'Message is required.' }, { status: 400 });

	const subject = `Portfolio contact from ${name}`;
	const text = `From: ${name} <${email}>\n\n${message}`;

	try {
		const { error } = await resend.emails.send({
			from: RESEND_FROM_EMAIL || 'onboarding@resend.dev',
			to: CONTACT_TO_EMAIL,
			replyTo: email,
			subject,
			text
		});
		if (error) {
			console.error('[contact] resend error:', error);
			return json({ ok: false, error: 'Failed to send.' }, { status: 502 });
		}
		return json({ ok: true });
	} catch (err) {
		console.error('[contact] unexpected error:', err);
		return json({ ok: false, error: 'Failed to send.' }, { status: 500 });
	}
};
