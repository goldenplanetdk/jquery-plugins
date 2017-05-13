const brands = window.demoBrands;

/**
 * Mock AJAX requests
 */
$.mockjaxSettings.responseTime = [250, 750];

$.mockjax({
	url: '/foobar/search',
	response: function() {
		this.responseText = brands;
	},
});

$.mockjax({
	url: '/foobar/new',
	type: 'POST',
	response: function(request) {

		const id = _.max(_.map(brands, 'id')) + 1;
		let name = request.data.brand;

		if (typeof name === 'object') {
			name = name.en;
		}

		brands.push({id, name});

		this.responseText = {
			success: true,
			id,
			name,
		};
	},
});

$.mockjax({
	url: '/foobar/delete',
	type: 'POST',
	response(request) {

		_.remove(brands, {id: request.data.id});

		this.responseText = {
			success: true,
		};
	},
});

