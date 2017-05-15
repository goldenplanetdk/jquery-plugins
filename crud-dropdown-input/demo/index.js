// Multiple inputs that share same data can be synchronized
// by using the create/delete AJAX callbacks
const ajaxCallback = function(widget, listItemsPromise) {

	$('.crud-foobar, .crud-i18n').each(function() {

		const widget = $(this).data('gp-crudDropdownInput');

		// Prevent multiple requests by providing reference to a promise
		widget && widget.reinitList(listItemsPromise);
	});

};

const responseCallbacks = {
	createSuccess: ajaxCallback,
	deleteSuccess: ajaxCallback,
};

$('.crud-foobar').crudDropdownInput({
	ajaxCreateRequestDataKey: 'brand',
	urls: {
		edit: '/foobar/',
		ajaxSearch: '/foobar/search',
		ajaxCreate: '/foobar/new',
		ajaxDelete: '/foobar/delete',
	},
	responseCallbacks,
});

$('.crud-i18n').crudDropdownInput({
	ajaxCreateRequestDataKey: 'brand',
	responseCallbacks,
	translations: {
		add: 'Tilføj',
		confirmDelete: 'Er du sikker på at du vil slette det?',
	},
	createCallback(widget) {
		widget.$input.removeClass('form-control');
	},
});

$('.crud-wishlist').crudDropdownInput({
	ajaxCreateRequestDataKey: 'wishlist',
	urls: {
		edit: '/wishlist/',
		ajaxSearch: '/wishlist/search',
		ajaxSelect: '/wishlist/select',
		ajaxCreate: '/wishlist/new',
		ajaxDelete: '/wishlist/delete',
	},
	ajaxRequestPayload: {
		productId: 33,
	},
	responseCallbacks: {
		searchSuccess: selectSuccess,
		selectSuccess,
	},
});

function selectSuccess(widget) {

	const $activeWishlists = $('#activeWishlists').empty();
	const activeIds = widget.getActiveIds();
	const activeItemTitles = widget.getActiveTitles();

	activeIds.forEach(function(id, index) {
		$activeWishlists.append(`<li>${id}: ${activeItemTitles[index]}</li>`);
	});
}

