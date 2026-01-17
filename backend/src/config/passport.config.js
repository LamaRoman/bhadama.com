import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./prisma.config.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const profilePhoto = profile.photos?.[0]?.value;
        const googleId = profile.id;

        // Get role from state parameter
        const role = req.query.state || "USER";

        if (!email) {
          return done(new Error("No email found in Google profile"), null);
        }

        // Check if user exists by googleId or email
        let user = await prisma.user.findFirst({
          where: {
            OR: [{ googleId }, { email }],
          },
        });

        if (user) {
          // Existing user - ALWAYS update emailVerified to true for Google users
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleId, // Ensure googleId is set
              profilePhoto: user.profilePhoto || profilePhoto,
              emailVerified: true, // ✅ ALWAYS set to true
              lastLoginAt: new Date(),
            },
          });
          console.log("✅ Existing user logged in:", { 
            id: user.id, 
            role: user.role, 
            emailVerified: user.emailVerified 
          });
        } else {
          // New user - create with emailVerified: true
          user = await prisma.user.create({
            data: {
              email,
              name,
              googleId,
              profilePhoto,
              emailVerified: true, // ✅ Set to true
              role: role === "HOST" ? "HOST" : "USER",
            },
          });
          console.log("✅ New user created:", { 
            id: user.id, 
            role: user.role,
            emailVerified: user.emailVerified 
          });
        }

        return done(null, user);
      } catch (error) {
        console.error("❌ Passport Google Strategy error:", error);
        return done(error, null);
      }
    }
  )
);
// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
