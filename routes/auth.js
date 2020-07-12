const express = require('express');

const { check, body } = require('express-validator');

const router = express.Router();

const authController = require('../controllers/auth');

const User = require('../models/user');

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post(
	'/login',
	[
		body('email', 'Please enter a valid email.').isEmail().normalizeEmail(),
		body(
			'password',
			'Please insert a valid alphanumeric password of at least a lenght of 5'
		)
			.isLength({ min: 4 })
			.isAlphanumeric()
			.trim(),
	],
	authController.postLogin
);

router.post(
	'/signup',
	[
		body('email')
			.isEmail()
			.custom((value, { req }) => {
				if (value === 'test@test.com') {
					throw new Error('This email address is forbidden!');
				}
				// return true;
				return User.findOne({ email: value }).then(userDoc => {
					if (userDoc) {
						return Promise.reject('Email exists already!');
					}
				});
			})
			.normalizeEmail(),
		body(
			'password',
			'Please insert a valid alphanumeric password of at least a lenght of 5'
		)
			.isLength({ min: 5 })
			.isAlphanumeric()
			.trim(),
		body('confirmPassword')
			.trim()
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					throw new Error('Passwords have to match!');
				}
				return true;
			}),
	],
	authController.postSignup
);

router.post('/logout', authController.postLogout);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
