# Node JS , Express Boilerplate

Built using modern technologies Node.js , Express.js
See example-env.txt for ENVIRONMENT variable required for running the Application

# For Getting your API key use

### For sending, recvieing email in dev and staging environemnts

https://mailtrap.io

### For Database use mongo

# Available rScript for this project

"start": "node server.js",

"dev": "nodemon server.js",

"start:prod": "NODE_ENV=production nodemon server.js",

### Main Route required for every request (your_url/api/v1/users)

## Available routes for Authentication

POST-- > '/sign-up'

POST-- > '/login'

GET-- > /logout'

GET-- > '/isLoggedIn'

POST-- > '/forgotPassword

PATCH-- > '/resetPassword/:token'

## Protected Route (Required Login user, or Token to access )

POST-- > userRoute.use(protect);

GET-- > /me',

PATCH-- > '/updateMe' --> uploadUserPhoto, resizeUserPhoto, updateMe);

DELETE-- > '/deleteMe',

PATCH-- > /updateMyPassword',

## Protected Route Restrcit to Admin (Required Login user with super previlage, or Token to access )

userRoute.route('/').get(getAllUsers).post(createUser);

userRoute.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);
