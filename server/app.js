// // server.js
// require('dotenv').config();
// const express = require('express');
// const session = require('express-session');
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;

// const app = express();
// const PORT = process.env.PORT || 3000;

// // === In-memory user store (demo only). Use DB in production. ===
// const users = new Map();

// // === Session middleware (for demo). In prod, use a persistent store. ===
// app.use(
// 	session({
// 		secret: process.env.SESSION_SECRET || 'dev_secret_change_this',
// 		resave: false,
// 		saveUninitialized: false,
// 		cookie: {
// 			httpOnly: true,
// 			// secure: true, // enable when HTTPS
// 			sameSite: 'lax',
// 		},
// 	})
// );

// // === Initialize Passport ===
// app.use(passport.initialize());
// app.use(passport.session());

// // === Passport serialize/deserialize ===
// passport.serializeUser((user, done) => {
// 	// store user id in session
// 	done(null, user.id);
// });
// passport.deserializeUser((id, done) => {
// 	const user = users.get(id) || null;
// 	done(null, user);
// });

// // === Configure Google Strategy ===
// passport.use(
// 	new GoogleStrategy(
// 		{
// 			clientID: process.env.GOOGLE_CLIENT_ID,
// 			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
// 			callbackURL: process.env.CALLBACK_URL,
// 		},
// 		async (accessToken, refreshToken, profile, done) => {
// 			try {
// 				// profile contains user info: id, displayName, emails, photos
// 				// Save or update user in your DB. Here we use in-memory Map.
// 				const user = {
// 					id: profile.id,
// 					displayName: profile.displayName,
// 					emails: profile.emails,
// 					photos: profile.photos,
// 					provider: 'google',
// 					accessToken,
// 					refreshToken,
// 				};
// 				users.set(user.id, user);
// 				return done(null, user);
// 			} catch (err) {
// 				return done(err);
// 			}
// 		}
// 	)
// );

// // === Helper to require authentication on routes ===
// function ensureAuthenticated(req, res, next) {
// 	if (req.isAuthenticated && req.isAuthenticated()) return next();
// 	res.redirect('/auth/google');
// }

// // === Routes ===
// app.get('/', (req, res) => {
// 	res.send(`<h2>Home</h2>
//     <a href="/auth/google">Sign in with Google</a>
//     <p><a href="/profile">Profile (protected)</a></p>`);
// });

// // Trigger OAuth with Google
// app.get(
// 	'/auth/google',
// 	passport.authenticate('google', {
// 		scope: ['profile', 'email'],
// 		prompt: 'consent',
// 	})
// );

// // Google OAuth callback
// app.get(
// 	'/auth/google/callback',
// 	passport.authenticate('google', { failureRedirect: '/login', session: true }),
// 	(req, res) => {
// 		// Successful authentication, redirect to profile.
// 		res.redirect('/profile');
// 	}
// );

// app.get('/profile', ensureAuthenticated, (req, res) => {
// 	const user = req.user;
// 	res.send(`<h2>Profile</h2>
//     <p>ID: ${user.id}</p>
//     <p>Name: ${user.displayName}</p>
//     <p>Emails: ${JSON.stringify(user.emails)}</p>
//     <p><img src="${
// 			user.photos && user.photos[0] ? user.photos[0].value : ''
// 		}" alt="avatar" /></p>
//     <p><a href="/logout">Logout</a></p>`);
// });

// app.get('/logout', (req, res) => {
// 	req.logout((err) => {
// 		// passport v0.6 requires callback
// 		if (err) {
// 			return res.status(500).send('Logout error');
// 		}
// 		req.session.destroy(() => res.redirect('/'));
// 	});
// });

// app.get('/login', (req, res) => {
// 	res.send('<h2>Login failed</h2><a href="/auth/google">Try again</a>');
// });

// app.listen(PORT, () =>
// 	console.log(`Server started on http://localhost:${PORT}`)
// );
// app.js

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./auth/passport');
const authRoutes = require('./auth/routes');
const gmailRoutes = require('./gmail/gmailController');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------------
// 1. BASIC MIDDLEWARE
// -------------------------
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------
// 2. SESSION MIDDLEWARE
// -------------------------
app.use(
	session({
		name: 'sid',
		secret: process.env.SESSION_SECRET || 'dev_change_me',
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			sameSite: 'lax',
			// secure: true,   // enable when HTTPS
			maxAge: 1000 * 60 * 60 * 24, // 1 day
		},
	})
);

// -------------------------
// 3. PASSPORT INIT
// -------------------------
app.use(passport.initialize());
app.use(passport.session());

// -------------------------
// 4. AUTH ROUTES
// -------------------------
app.use('/auth', authRoutes);

// -------------------------
// 5. AUTH PROTECTOR
// -------------------------
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated && req.isAuthenticated()) return next();

	// HTML requests → redirect to Google login
	if (req.accepts('html')) return res.redirect('/auth/google');

	// API requests → return 401 JSON
	return res.status(401).json({ error: 'Unauthorized' });
}

// -------------------------
// 6. GMAIL ROUTES (MUST COME AFTER PASSPORT)
// -------------------------
app.use('/api/emails', ensureAuthenticated, gmailRoutes);

// -------------------------
// 7. PROFILE ROUTE
// -------------------------
app.get('/profile', ensureAuthenticated, (req, res) => {
	const user = req.user;

	res.send(`
    <h1>Profile</h1>
    <p>ID: ${user.id}</p>
    <p>Name: ${user.displayName || user.name || ''}</p>
    <p>Email: ${
			user.emails ? user.emails.map((e) => e.value).join(', ') : ''
		}</p>
    <p><img src="${user.photos?.[0]?.value || ''}" width="100"/></p>
    <p><a href="/logout">Logout</a></p>
  `);
});

// -------------------------
// 8. LOGOUT
// -------------------------
app.get('/logout', (req, res, next) => {
	req.logout((err) => {
		if (err) return next(err);

		req.session.destroy(() => {
			res.clearCookie('sid');
			res.redirect('/');
		});
	});
});

// -------------------------
// 9. HOME
// -------------------------
app.get('/', (req, res) => {
	res.send(`
    <h2>Home</h2>
    ${
			req.isAuthenticated && req.isAuthenticated()
				? `<p>Signed in as ${req.user.displayName}</p>
           <a href="/profile">Profile</a> | <a href="/logout">Logout</a>`
				: `<a href="/auth/google">Sign in with Google</a>`
		}
  `);
});

// -------------------------
// 10. ERROR HANDLER
// -------------------------
app.use((err, req, res, next) => {
	console.error(err);
	if (req.accepts('html')) return res.status(500).send('Server error');
	res.status(500).json({ error: 'Server error' });
});

// -------------------------
// 11. START SERVER
// -------------------------
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
