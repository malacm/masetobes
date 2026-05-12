import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const RESEND_API_KEY = env.RESEND_API_KEY;

export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export const isResendConfigured = Boolean(RESEND_API_KEY);
