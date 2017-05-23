window.less.pageLoadFinished.then(function() {
	$('#compilingLess').remove();
});

/**
 * Multiple inputs that share same data can be synchronized
 * by using the create/delete AJAX callbacks
 *
 * Shared callback for `crud-foobar` and `crud-i18n`
 */
const ajaxListModificationCallback = function(widget, listItemsPromise) {

	$('.crud-foobar, .crud-i18n').each(function() {

		const widget = $(this).data('gp-crudDropdownInput');

		// Prevent multiple requests by providing reference to a promise
		widget && widget.reinitList(listItemsPromise);
	});

};

const responseCallbacks = {
	createSuccess: ajaxListModificationCallback,
	deleteSuccess: ajaxListModificationCallback,
};

/**
 * A widget instance with default options, linked with `crud-i18n`
 */
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

/**
 * New item title with localization
 */
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

/**
 * Shared callback for wishlists
 */
const ajaxWishlistModificationCallback = function(widget, listItemsPromise) {

	$('.crud-product-wishlist, .crud-wishlist').each(function() {

		const widget = $(this).data('gp-crudDropdownInput');

		// Prevent multiple requests by providing reference to a promise
		widget && widget.reinitList(listItemsPromise);
	});

};

/**
 * Product wishlists
 */
$('.crud-product-wishlist').crudDropdownInput({
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
		searchSuccess: selectProductWishlistSuccess,
		selectSuccess: selectProductWishlistSuccess,
		createSuccess: ajaxWishlistModificationCallback,
		deleteSuccess: ajaxWishlistModificationCallback,
	},
});

function selectProductWishlistSuccess(widget) {

	const $activeProductWishlists = $('#activeProductWishlists').empty();
	const activeIds = widget.getActiveIds();
	const activeItemTitles = widget.getActiveTitles();

	activeIds.forEach(function(id, index) {
		$activeProductWishlists.append(`<li>${id}: ${activeItemTitles[index]}</li>`);
	});
}

/**
 * Wishlists
 */
$('.crud-wishlist').crudDropdownInput({
	ajaxCreateRequestDataKey: 'wishlist',
	urls: {
		edit: '/wishlist/',
		select: '/wishlist/',
		ajaxSearch: '/wishlist/search',
		ajaxSelect: '/wishlist/select',
		ajaxCreate: '/wishlist/new',
		ajaxDelete: '/wishlist/delete',
	},
	responseCallbacks: {
		createSuccess: ajaxWishlistModificationCallback,
		deleteSuccess: ajaxWishlistModificationCallback,
	},
});
