// Multiple inputs that share same data can be synchronized
// by using the create/delete AJAX callbacks
const ajaxCallback = function(widget, listItemsPromise) {

	$('.gp-crud-dropdown-input').each(function() {

		const widget = $(this).data('gp-crudDropdownInput');

		// Prevent multiple requests by providing reference to a promise
		widget.reinitList(listItemsPromise);
	});

};

const responseCallbacks = {
	addSuccess: ajaxCallback,
	deleteSuccess: ajaxCallback,
};

$('.crud-foobar').crudDropdownInput({
	ajaxCreateRequestDataKey: 'brand',
	urls: {
		edit: '/foobar/',
		ajaxCreate: '/foobar/new',
		ajaxDelete: '/foobar/delete',
		ajaxSearch: '/foobar/search',
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
		ajaxSelect: '/wishlist/select',
		ajaxCreate: '/wishlist/new',
		ajaxDelete: '/wishlist/delete',
		ajaxSearch: '/wishlist/search',
	},
	responseCallbacks: {
		searchSuccess: selectSuccess,
		selectSuccess,
	},
});

function selectSuccess(widget) {
	$('#activeWishlist').text(widget.getActiveId() + ': ' + widget.getActiveText());
}

