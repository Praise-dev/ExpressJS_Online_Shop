exports.page404 = (req, res, next) => {
	res.status(404);
	// res.sendFile(path.join(rootDir, 'views', '404.html'));
	res.render('404', {
		pageTitle: '404 Not Found',
		path: '/404',
		isAuthenticated: req.session.isLoggedIn,
	});
};

exports.get500 = (req, res, next) => {
	res.status(500);
	// res.sendFile(path.join(rootDir, 'views', '404.html'));
	res.render('500', {
		pageTitle: 'Error!',
		path: '/500',
		isAuthenticated: req.session.isLoggedIn,
	});
};
