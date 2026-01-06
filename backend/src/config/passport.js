import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./prisma.js";

// Google Strategy
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
          console.log("🟡 [PASSPORT] Callback received");
        console.log("🟡 [PASSPORT] req.query:", req.query);
        console.log("🟡 [PASSPORT] req.query.state:", req.query.state);
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const profilePhoto = profile.photos?.[0]?.value;
        const googleId = profile.id;
        
        // Get role from state parameter
        const role = req.query.state || "USER";

         console.log("🟡 [PASSPORT] Final role to use:", role);
        console.log("🟡 [PASSPORT] Email:", email);
        if (!email) {
          return done(new Error("No email found in Google profile"), null);
        }

        // Check if user exists by googleId or email
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { googleId },
              { email }
            ]
          }
        });

        if (user) {
          console.log("🟡 [PASSPORT] Existing user found:", { id: user.id, role: user.role });
          // Existing user - update Google info if not already set
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId,
                profilePhoto: user.profilePhoto || profilePhoto,
                emailVerified: true
              }
            });
          }
        } else {
          console.log("🟡 [PASSPORT] Creating NEW user with role:", role);
          // New user - create with the role from state
          user = await prisma.user.create({
            data: {
              email,
              name,
              googleId,
              profilePhoto,
              emailVerified: true,
              role: role === "HOST" ? "HOST" : "USER"
              // password is optional - don't include it
            }
          });
          console.log("🟡 [PASSPORT] New user created:", { id: user.id, role: user.role });
        }

        return done(null, user);
      } catch (error) {
        console.error("❌ [PASSPORT] Error:", error);
        console.error("Google OAuth error:", error);
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
