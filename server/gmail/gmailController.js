// gmailController.js
const express = require('express');
const router = express.Router();
const gmailService = require('./gmailService');

// GET /api/emails → list last 30 days emails
router.get('/', async (req, res) => {
	try {
		const accessToken = req.user.accessToken;

		if (!accessToken) {
			return res.status(400).json({ error: 'No access token available.' });
		}

		const emails = await gmailService.getLast30DaysEmails(accessToken);
		res.json(emails);
	} catch (err) {
		console.error('Error fetching emails:', err);
		res.status(500).json({ error: 'Failed to fetch emails.' });
	}
});

// GET /api/emails/:id → single email details
router.get('/:id', async (req, res) => {
	try {
		const accessToken = req.user.accessToken;

		if (!accessToken) {
			return res.status(400).json({ error: 'No access token available.' });
		}

		const email = await gmailService.getEmailById(accessToken, req.params.id);
		res.json(email);
	} catch (err) {
		console.error('Error fetching email:', err);
		res.status(500).json({ error: 'Failed to fetch email.' });
	}
});

module.exports = router;
