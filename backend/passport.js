// passport.js
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import userService from "./services/userService.js";

// LocalStrategy: login cu email + password
passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password"
        },
        async (email, password, done) => {
            try {
                const user = await userService.getUserByEmailWithPassword(email);
                if (!user) {
                    return done(null, false, { message: "Invalid email or password" });
                }

                const isValid = await bcrypt.compare(password, user.password_hash);
                if (!isValid) {
                    return done(null, false, { message: "Invalid email or password" });
                }

                const { password_hash, ...safeUser } = user;
                return done(null, safeUser);
            } catch (err) {
                return done(err);
            }
        }
    )
);

// save session
passport.serializeUser((user, done) => {
    done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
    try {
        const user = await userService.getUserById(id);
        if (!user) return done(null, false);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

export default passport;
