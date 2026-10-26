import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails?.[0]?.value;
      const emailVerified = profile._json?.email_verified;

      if (!emailVerified) {
        return done(new Error("EMAIL_NOT_VERIFIED"));
      }

      return done(null, {
        provider: "GOOGLE",
        providerId: profile.id,
        email,
        name: profile.displayName || email,
      });
    }
  )
);

export { passport };
