const passport = require("passport");
const GithubStrategy = require("passport-github2").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// GOOGLE STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (token, tokenSecret, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        } else {
          const newUser = new User({
            googleId: profile.id,
            username: profile.emails[0].value,
            name: profile.displayName,
            image: profile.photos[0].value,
          });
          user = await newUser.save();
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

// GITHUB STRATEGY
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
    },
    async (token, tokenSecret, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });
        if (user) {
          return done(null, user);
        } else {
            const email =
              profile.emails && profile.emails[0] && profile.emails[0].value;
      
          const newUser = new User({
            githubId: profile.id,
            username: email ||profile.username,
            name: profile.displayName || profile.username,
            image: profile.photos[0].value,
          });
          user = await newUser.save();
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);
