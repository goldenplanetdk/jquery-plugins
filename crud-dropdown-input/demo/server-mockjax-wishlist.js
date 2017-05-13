const wishlists = [
	{
		id: 1,
		name: 'Default wishlist',
	}
];

/**
 * Mock AJAX requests
 */
$.mockjaxSettings.responseTime = [250, 750];

$.mockjax({
	url: '/wishlist/search',
	response: function() {
		this.responseText = wishlists;
	},
});

$.mockjax({
	url: '/wishlist/select',
	type: 'POST',
	response: function(request) {

		this.responseText = {
			success: true,
		};
	},
});

$.mockjax({
	url: '/wishlist/new',
	type: 'POST',
	response: function(request) {

		const id = _.max(_.map(wishlists, 'id')) + 1;
		const name = request.data.wishlist;

		wishlists.push({id, name});

		this.responseText = {
			success: true,
			id,
			name,
		};
	},
});

$.mockjax({
	url: '/wishlist/delete',
	type: 'POST',
	response(request) {

		_.remove(wishlists, {id: request.data.id});

		this.responseText = {
			success: true,
		};
	},
});

