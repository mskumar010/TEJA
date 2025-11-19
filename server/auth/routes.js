const express = require('express');
const passport = require('./passport');
const router = express.Router();

router.get(
	'/google',
	passport.authenticate('google', {
		scope: [
			'profile',
			'email',
			'https://www.googleapis.com/auth/gmail.readonly',
		],
		prompt: 'consent',
		accessType: 'offline',
	})
);
router.get(
	'/google/callback',
	passport.authenticate('google', { failureRedirect: '/login' }),
	(req, res) => res.redirect('/profile')
);

module.exports = router;
