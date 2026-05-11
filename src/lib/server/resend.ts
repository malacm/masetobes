import { Resend } from 'resend';
import { RESEND_API_KEY } from '$env/static/private';

export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export const isResendConfigured = Boolean(RESEND_API_KEY);
