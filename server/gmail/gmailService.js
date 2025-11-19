// gmailService.js
const axios = require('axios');

// Build Gmail API instance with auth header
function gmailClient(accessToken) {
	return axios.create({
		baseURL: 'https://gmail.googleapis.com/gmail/v1/users/me',
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});
}

// Get date 30 days ago in Gmail query format
function get30DaysAgoQuery() {
	const date = new Date();
	date.setDate(date.getDate() - 30);

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `after:${year}/${month}/${day}`;
}

// Extract useful info from Gmail message payload
function extractMetadata(payload) {
	const headers = payload.headers || [];

	const get = (name) =>
		headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ||
		'';

	return {
		subject: get('Subject'),
		from: get('From'),
		date: get('Date'),
	};
}

module.exports = {
	// Fetch list of emails from the last 30 days
	async getLast30DaysEmails(accessToken) {
		const client = gmailClient(accessToken);

		// Step 1: List message IDs
		const query = get30DaysAgoQuery();

		const listRes = await client.get('/messages', {
			params: {
				q: query,
				labelIds: 'INBOX',
				maxResults: 20, // avoid overload
			},
		});

		const messages = listRes.data.messages || [];

		// Step 2: Fetch details for each message
		const results = [];

		for (const msg of messages) {
			const msgRes = await client.get(`/messages/${msg.id}`, {
				params: { format: 'metadata' },
			});

			const metadata = extractMetadata(msgRes.data.payload);

			results.push({
				id: msg.id,
				snippet: msgRes.data.snippet,
				...metadata,
			});
		}

		return results;
	},

	// Fetch a single email
	async getEmailById(accessToken, messageId) {
		const client = gmailClient(accessToken);

		const res = await client.get(`/messages/${messageId}`, {
			params: { format: 'full' },
		});

		const metadata = extractMetadata(res.data.payload);

		return {
			id: messageId,
			snippet: res.data.snippet,
			body: res.data.payload,
			...metadata,
		};
	},
};
