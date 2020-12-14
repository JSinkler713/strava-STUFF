const passport = require('passport');
const db = require('../models');
// require strava strategy
const StravaStrategy = require('passport-strava-oauth2').Strategy

/*
 * This is Passport's strategy to provide local authentication. We provide the
 * following information to the LocalStrategy:
 *
 * Configuration: An object of data to identify our authentication fields, the
 * username and password
 *
 * Callback function: A function that's called to log the user in. We can pass
 * the email and password to a database query, and return the appropriate
 * information in the callback. Think of "cb" as a function that'll later look
 * like this:
 *
 * login(error, user) {
 *   // do stuff
 * }
 *
 * We need to provide the error as the first argument, and the user as the
 * second argument. We can provide "null" if there's no error, or "false" if
 * there's no user.
 */
// passport.use(new LocalStrategy({
//   usernameField: 'email',
//   passwordField: 'password'
// }, (email, password, cb) => {
//   db.user.findOne({ 
//     where: { email }
//   }).then(user => {
//     if (!user || !user.validPassword(password)) {
//       cb(null, false);
//     } else {
//       cb(null, user);
//     }
//   }).catch(cb);
// }));

// Strava Strategy
passport.use(new StravaStrategy({
  clientID: 58043,
  clientSecret: 'da48b83ca2c90189566198e06ce27d706aabd448',
  callbackURL: "http://localhost:3000/auth/strava/callback"
},
function(accessToken, refreshToken, profile, done) {
    // To keep the example simple, the user's Strava profile is returned to
    // represent the logged-in user.  In a typical application, you would want
    // to associate the Strava account with a user record in your database,
    // and return that user instead.
    console.log("Refresh token ", refreshToken);
    console.log("Access token ", accessToken);

    db.user.findOrCreate({ 
      where: { strava_id: profile.id },
      defaults: {
        name: profile.displayName,
        email: "someEmail@email.com", // Must be changed to something like: profile.emails[0].value
        strava_id: profile.id
      }
    }).then(async user => {
      user[0].access_token = accessToken;
      await user[0].save()

      done(null, user);
    }).catch(done);
  }
));

/*
 * Passport "serializes" objects to make them easy to store, converting the
 * user to an identifier (id)
 */
passport.serializeUser((user, cb) => {
  cb(null, user[0].id);
});

/*
 * Passport "deserializes" objects by taking the user's serialization (id)
 * and looking it up in the database
 */
passport.deserializeUser((id, cb) => {
  db.user.findByPk(id).then(user => {
    cb(null, user);
  }).catch(cb);
});

// export the Passport configuration from this module
module.exports = passport;