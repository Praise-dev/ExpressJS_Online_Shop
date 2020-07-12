const User = require('../models/user');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodeMailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const transporter = nodeMailer.createTransport(
	sendgridTransport({
		auth: {
			api_key: process.env.SENDGRID_API_KEY,
		},
	})
);

exports.getLogin = (req, res, next) => {
	//const isLoggedIn = req.get('Cookie').split('=')[1];

	let message = req.flash('error');
	const errMessage = message.length > 0 ? message[0] : null;
	res.render('auth/login', {
		path: '/login',
		pageTitle: 'Login',
		isAuthenticated: false,
		errorMessage: errMessage,
		oldInput: {
			email: '',
			password: '',
		},
		validationError: [],
	});
};

exports.getSignup = (req, res, next) => {
	let message = req.flash('error');
	const errMessage = message.length > 0 ? message[0] : null;
	const errors = validationResult(req);
	res.render('auth/signup', {
		path: '/signup',
		pageTitle: 'Signup',
		isAuthenticated: false,
		errorMessage: errMessage,
		oldInput: {
			email: '',
			password: '',
			confirmPassword: '',
		},
		validationError: errors.array(),
	});
};

exports.getReset = (req, res, next) => {
	let message = req.flash('error');
	const errMessage = message.length > 0 ? message[0] : null;
	res.render('auth/reset', {
		path: '/reset',
		pageTitle: 'Reset Password',
		isAuthenticated: false,
		errorMessage: errMessage,
	});
};

exports.getNewPassword = (req, res, next) => {
	const token = req.params.token;
	User.findOne({
		resetToken: token,
		resetTokenExpiration: { $gt: Date.now() },
	})
		.then(user => {
			let message = req.flash('error');
			const errMessage = message.length > 0 ? message[0] : null;
			res.render('auth/new-password', {
				path: '/new-password',
				pageTitle: 'New Password',
				errorMessage: errMessage,
				userId: user._id.toString(),
				passwordToken: token,
			});
		})
		.catch(err => {
			console.log(err);
			// res.redirect('/500');
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postLogin = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/login', {
			path: '/login',
			pageTitle: 'Login',
			isAuthenticated: false,
			errorMessage: errors.array()[0].msg,
			oldInput: {
				email: email,
				password: password,
			},
			validationError: errors.array(),
		});
	}

	User.findOne({ email: email })
		.then(user => {
			if (!user) {
				return res.status(422).render('auth/login', {
					path: '/login',
					pageTitle: 'Login',
					isAuthenticated: false,
					errorMessage: errors.array()[0].msg,
					oldInput: {
						email: email,
						password: password,
					},
					validationError: [],
				});
			}
			return bcrypt.compare(password, user.password).then(doMatch => {
				if (!doMatch) {
					return res.status(422).render('auth/login', {
						path: '/login',
						pageTitle: 'Login',
						isAuthenticated: false,
						errorMessage: errors.array()[0].msg,
						oldInput: {
							email: email,
							password: password,
						},
						validationError: [],
					});
				}
				req.session.isLoggedIn = true;
				req.session.user = user;
				return req.session.save(err => {
					console.log(err);
					console.log(req.session);
					res.redirect('/');
				});
			});
		})
		.catch(err => {
			console.log(err);
			// res.redirect('/500');
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postSignup = (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	const confirmPassword = req.body.confirmPassword;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).render('auth/signup', {
			path: '/signup',
			pageTitle: 'Signup',
			isAuthenticated: false,
			errorMessage: errors.array()[0].msg,
			oldInput: {
				email: email,
				password: password,
				confirmPassword: req.body.confirmPassword,
			},
			validationError: errors.array(),
		});
	}
	bcrypt
		.hash(password, 12)
		.then(hashedPassword => {
			const user = new User({
				email: email,
				password: hashedPassword,
				cart: { items: [] },
			});
			return user.save();
		})
		.then(() => {
			res.redirect('/login');
			return transporter
				.sendMail({
					to: email,
					from: 'shop@node-complete.com',
					subject: 'Signup successfully',
					html: '<h1> You successfully signed up!</h1>',
				})
				.catch(err => console.log(err));
		})
		.catch(err => {
			console.log(err);
			// res.redirect('/500');
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};

exports.postLogout = (req, res, next) => {
	req.session.destroy(err => {
		if (err) {
			console.log(err);
		}
		res.redirect('/');
	});
};

exports.postReset = (req, res, next) => {
	const cryptoToken = crypto.randomBytes(32, (err, buffer) => {
		if (err) {
			console.log(err);
			return res.redirect('/reset');
		}
		const token = buffer.toString('hex');
		User.findOne({ email: req.body.email })
			.then(user => {
				if (!user) {
					req.flash('error', 'No account with email found');
					return res.redirect('/reset');
				}
				user.resetToken = token;
				user.resetTokenExpiration = Date.now() + 3600000;
				return user.save();
			})
			.then(result => {
				res.redirect('/');
				transporter.sendMail({
					to: req.body.email,
					from: 'shop@node-complete.com',
					subject: 'Password Reset ',
					html: `
							<p> You requested a password reset </p>
							<p> Click this <a href="http://localhost:3000/reset/${token}" >link</> to reset your password </p>
							`,
				});
			})
			.catch(err => {
				console.log(err);
				// res.redirect('/500');
				const error = new Error(err);
				error.httpStatusCode = 500;
				return next(error);
			});
	});
};

exports.postNewPassword = (req, res, next) => {
	const newPassword = req.body.password;
	const userId = req.body.userId;
	const passwordToken = req.body.passwordToken;
	let resetUser;

	User.findOne({
		resetToken: passwordToken,
		resetTokenExpiration: { $gt: Date.now() },
		_id: userId,
	})
		.then(user => {
			resetUser = user;
			return bcrypt.hash(newPassword, 12);
		})
		.then(hashedPassword => {
			resetUser.password = hashedPassword;
			resetUser.resetToken = null;
			resetUser.resetTokenExpiration = undefined;
			return resetUser.save();
		})
		.then(() => {
			res.redirect('/login');
		})
		.catch(err => {
			console.log(err);
			// res.redirect('/500');
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});
};
