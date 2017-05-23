const wishlists = [
	{
		id: 1,
		name: 'Default wishlist',
		products: [1, 2, 33],
	},
	{
		id: 2,
		name: 'Sport',
		products: [32],
	},
	{
		id: 3,
		name: 'Cheap',
		products: [32],
	}
];

const products = [];

products[33] = {
	id: 33,
	wishlists: [1],
};

/**
 * Mock AJAX requests
 */
$.mockjaxSettings.responseTime = [250, 750];

/**
 * GET all wishlists
 */
$.mockjax({
	url: '/wishlist/search',
	response: function() {

		console.groupCollapsed('Server-side data for wishlists');
		console.log('SERVER Products:', products);
		console.log('SERVER Wishlists:', wishlists);
		console.groupEnd();

		this.responseText = wishlists;
	},
});

/**
 * GET all wishlists for specific product
 */
$.mockjax({
	url: '/wishlist/search_for_product',
	response: function(request) {

		const {productId} = request.data;
		const productWishlistIds = products[productId].wishlists;

		const productWishlists = productWishlistIds.map(function(productWishlistId) {

			return _.find(wishlists, {id: productWishlistId});
		});

		console.log('SERVER: Product is in wishlists:', productWishlists);

		this.responseText = productWishlists;
	},
});

/**
 * POST select wishlist for product
 */
$.mockjax({
	url: '/wishlist/select',
	type: 'POST',
	response: function(request) {

		const {id, productId, deselect} = request.data;
		const product = products[productId];
		const wishlist = _.find(wishlists, {id});

		if (product) {

			if (deselect) {

				_.pull(wishlist.products, id);
				_.pull(product.wishlists, id);

			} else {

				if (!_.includes(product.wishlists, id)) {
					product.wishlists.push(id);
					wishlist.products.push(id);
				}
			}

			console.log(`SERVER: Product with id ${product.id} is ${deselect ? 'removed from' : 'added to'} wishlist #${id}`);
			console.log('SERVER: Product is in wishlists:', product.wishlists);

			this.responseText = {
				success: true,
				productWishlists: product.wishlists,
			};

		} else {

			bootbox.alert(`Here should redirect to wishlist with id: ${wishlist.id}`)

			this.responseText = {
				success: true,
			};
		}
	},
});

/**
 * POST new wishlist
 */
$.mockjax({
	url: '/wishlist/new',
	type: 'POST',
	response: function(request) {

		const {wishlist, productId} = request.data;
		const wishlistId = _.max(_.map(wishlists, 'id')) + 1;
		const product = products[productId];

		const wishlistItem = {
			id: wishlistId,
			name: wishlist,
			products: [],
		};

		if (product) {

			// Automatically add product to wishlist
			wishlistItem.products.push(productId);

			// Automatically add wishlist to product
			product.wishlists.push(wishlistId);

			console.log(`SERVER: Product with id ${product.id} is added to a new wishlist #${wishlistId}`);
			console.log('SERVER: Product is in wishlists:', product.wishlists);
		}

		wishlists.push(wishlistItem);

		this.responseText = {
			success: true,
			id: wishlistId,
			name: wishlist,
		};
	},
});

/**
 * POST delete wishlist
 */
$.mockjax({
	url: '/wishlist/delete',
	type: 'POST',
	response(request) {

		const {id} = request.data;

		// Remove wishlist from wish lists
		_.remove(wishlists, {id});

		// Remove wishlist from products list
		products.forEach((product) => _.pull(product.wishlists, id));

		this.responseText = {
			success: true,
		};
	},
});
