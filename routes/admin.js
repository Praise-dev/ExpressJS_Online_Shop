const path = require('path');

const express = require('express');

const rootDir = require('../util/path');

const router = express.Router();

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const { check, body } = require('express-validator');

// /admin/aadd-product => GET
router.get(
	'/add-product',
	[
		body('title').isString().isLength({ min: 3 }).trim(),
		body('price').isFloat(),
		body('description').trim().isLength({ min: 5, max: 400 }),
	],
	isAuth,
	adminController.getAddProduct
);

// // /admin/aadd-product => GET
router.get('/products', isAuth, adminController.getProducts);

// // /admin/add-product => POST
router.post('/add-product', isAuth, adminController.postAddProduct);

router.get(
	'/edit-product/:productId',
	[
		body('title').isString().isLength({ min: 3 }).trim(),
		body('price').isFloat(),
		body('description').trim().isLength({ min: 5, max: 400 }),
	],
	isAuth,
	adminController.getEditProduct
);

router.post('/edit-product', isAuth, adminController.postProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

exports.routes = router;
