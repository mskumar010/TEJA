const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Temporary in-memory user storage
const users = new Map();

// Serialize stores only user.id in session
passport.serializeUser((user, done) => {
	done(null, user.id);
});

// Deserialize loads user from map
passport.deserializeUser((id, done) => {
	const user = users.get(id) || null;
	done(null, user);
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.CALLBACK_URL,
		},
		async (accessToken, refreshToken, profile, done) => {
			let user = users.get(profile.id);

			if (!user) {
				user = {
					id: profile.id,
					displayName: profile.displayName,
					emails: profile.emails,
					photos: profile.photos,
					provider: profile.provider,
					accessToken, // ✔ important
					refreshToken, // ✔ optional but useful
				};
			} else {
				// update tokens in case Google refreshes them
				user.accessToken = accessToken;
				if (refreshToken) user.refreshToken = refreshToken;
			}

			users.set(profile.id, user);

			return done(null, user);
		}
	)
);

module.exports = passport;
