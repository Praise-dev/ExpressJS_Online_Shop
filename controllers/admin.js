const Product = require('../models/product');
const mongodb = require('mongodb');

const { validationResult } = require('express-validator');

exports.getAddProduct = (req, res, next) => {
	if (!req.session.isLoggedIn) {
		return res.redirect('/login');
	}
	// res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
	res.render('admin/edit-product', {
		pageTitle: 'Add Product',
		path: '/admin/add-product',
		editing: false,
		hasError: false,
		errorMessage: null,
		validationErrors: [],
	});
};

exports.postAddProduct = (req, res, next) => {
	const title = req.body.title;
	const price = req.body.price;
	const image = req.file;
	const description = req.body.description;
	if (!image) {
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/add-product',
			editing: false,
			hasError: true,
			product: {
				title: title,
				price: price,
				description: description,
			},
			errorMessage: 'Attached file is not an image.',
			validationErrors: [],
		});
	}
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Add Product',
			path: '/admin/add-product',
			editing: false,
			hasError: true,
			product: {
				title: title,
				price: price,
				description: description,
			},
			errorMessage: errors.array()[0].msg,
		});
	}
	const imageUrl = '/' + image.path;
	const product = new Product({
		title: title,
		price: price,
		description: description,
		imageUrl: imageUrl,
		userId: req.user,
	});
	console.log(product);
	product
		.save()
		.then(() => {
			res.redirect('/admin/products');
		})
		.catch(err => {
			console.log(err);
			// res.redirect('/500');
			const error = new Error(err);
			error.httpStatusCode = 500;
			return next(error);
		});

	// })
	// .catch(err => {
	// 	console.log(err);
	// });
};

exports.getEditProduct = (req, res, next) => {
	// res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
	const editMode = req.query.edit;
	if (!editMode) {
		return res.redirect('/');
	}
	const prodId = req.params.productId;

	Product.findById(prodId)
		//Product.findByPk(prodId)
		.then(product => {
			if (!product) {
				return res.redirect('/');
			}
			res.render('admin/edit-product', {
				pageTitle: 'Edit Product',
				path: '/admin/edit-product',
				editing: editMode,
				product: product,
				hasError: false,
				errorMessage: null,
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

exports.postProduct = (req, res, next) => {
	const prodId = req.body.productId;
	const title = req.body.title;
	const price = req.body.price;
	const image = req.file;
	const description = req.body.description;

	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).render('admin/edit-product', {
			pageTitle: 'Edit Product',
			path: '/admin/edit-product',
			editing: true,
			hasError: true,
			product: {
				title: title,
				price: price,
				description: description,
			},
			_id: prodId,
			errorMessage: errors.array()[0].msg,
			validationErrors: errors.array(),
		});
	}
	Product.findById(prodId)
		.then(product => {
			if (product.userId.toString() !== req.user._id.toString()) {
				return res.redirect('/');
			}
			product.title = title;
			product.price = price;
			product.description = description;
			if (image) {
				product.imageUrl = image.path;
			}
			return product.save().then(() => {
				console.log('saved');
				res.redirect('/admin/products');
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

exports.getProducts = (req, res, next) => {
	// 	// res.sendFile(path.join(rootDir, 'views', 'shop.html'));
	Product.find({ userId: req.user._id })
		.then(products => {
			res.render('admin/products', {
				pageTitle: 'Admin Products',
				prods: products,
				path: '/admin/products',
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

exports.deleteProduct = (req, res, next) => {
	// Product.deleteById(req.body.productId);
	Product.deleteOne({ _id: req.params.productId, userId: req.user._id })
		.then(() => {
			res.status(200).json({
				message: 'Success',
			});
		})
		.catch(err => {
			console.log(err);
			// res.redirect('/500');
			res.satus(200).json({
				message: 'Deleting product failed.',
			});
		});
};
