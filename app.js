//core modules
const path = require('path');

//environment variables
const dotenv = require('dotenv').config();

//express
const express = require('express');

//middlewear import
const bodyParser = require('body-parser');

//multer
const multer = require('multer');
const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
});
const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};
//handlebars import
const expressHbs = require('express-handlebars');

//session
const session = require('express-session');
const mongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

//router imports
const admin = require('./routes/admin');
const users = require('./routes/shop');
const authRoutes = require('./routes/auth');
const rootDir = require('./util/path');

const page404Controller = require('./controllers/error');

const app = express();
const store = new mongoDbStore({
	uri: process.env.MONGO_URI,
	collection: 'sessions',
});

const csrProtection = csrf();

//const mongoConnect = require('./util/database').mongoConnect;
const mongoose = require('mongoose');
const User = require('./models/user');

// app.engine(
// 	'hbs',
// 	expressHbs({
// 		layoutsDir: 'views/hbs/layouts',
// 		defaultLayout: 'main-layout',
// 		extname: 'hbs',
// 	})
// );

app.set('view engine', 'ejs');
app.set('views', 'views/ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	multer({
		storage: fileStorage,
		fileFilter: fileFilter,
	}).single('image')
);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
	session({
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: false,
		store: store,
	})
);
app.use(csrProtection);
app.use(flash());

app.use((req, res, next) => {
	res.locals.isAuthenticated = req.session.isLoggedIn;
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use((req, res, next) => {
	if (!req.session.user) {
		return next();
	}
	User.findById(req.session.user._id)
		.then(user => {
			if (!user) {
				return next();
			}
			req.user = user;
			next();
		})
		.catch(err => {
			next(new Error(err));
		});
});

//USERS PAGE
app.use(users);

// //admin route
app.use('/admin', admin.routes);

//auth routes
app.use(authRoutes);

app.get('/500', page404Controller.get500);

//404 PAGE
app.use(page404Controller.page404);

//error handling middleware
app.use((error, req, res, next) => {
	console.log(error);
	console.log(req.session);
	// res.sendFile(path.join(rootDir, 'views', '404.html'));
	res.status(500).render('500', {
		pageTitle: 'Error!',
		path: '/500',
		isAuthenticated: req.session.isLoggedIn,
	});
});

mongoose
	.connect(process.env.MONGO_URI, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
	})
	.then(client => {
		console.log('connected');
		app.listen(process.env.PORT || 3000, () => {
			console.log('server has started');
		});
	})
	.catch(err => console.log(err));
