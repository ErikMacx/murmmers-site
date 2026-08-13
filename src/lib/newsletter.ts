// The newsletter provider is MailerLite (publisher's choice, 2026-08-13).
//
// Preferred route, and the one this is set up for: leave this empty, and set
// MAILERLITE_KEY in the Pages project. Signups then post to /api/subscribe,
// which hands the address to MailerLite without the reader ever leaving
// murmmers.com. Until that key exists, /api/subscribe emails each signup to
// the press, so no address is lost while the account is being set up.
//
// Alternative: paste MailerLite's embedded-form action here (it looks like
// https://assets.mailerlite.com/jsonp/<id>/forms/<id>/subscribe) and every
// signup box posts straight to them instead.
//
// Either way, turn on double opt-in in MailerLite before the first campaign.
export const NEWSLETTER_ACTION = '';
