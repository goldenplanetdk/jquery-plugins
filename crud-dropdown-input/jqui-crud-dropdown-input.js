/**
 * @fileOverview
 * jQuery UI widget for a dropdown with inputs for new items with localization and remote state support
 *
 * Items in the dropdown are saved remotely
 * Input form control(s) appear where a new title can be specified
 *
 * The widget make use of following libraries:
 * - jQuery UI Widgets factory
 * - Bootstrap Dropdown
 * - Glyphicons
 *
 * The hidden input is required, it will contain selected value
 */
/**
 * @namespace gp.crudDropdownInput
 *
 * @example HTML
 *    <div
 *         class="gp-crud-dropdown-input crud-dropdown-input-for-foobar"
 *         data-edit="{{ path('BEFoobar') }}"
 *         data-create="{{ path('BEFoobarNewAjax') }}"
 *         data-delete="{{ path('BEFoobarDeleteAjax') }}"
 *         data-search="{{ path('BEFoobarSearchAjax') }}"
 *    >
 *        <label>{{ _('Title') }}:</label>
 *
 *        <new-item-input slot>
 *            <div class="locale" lang="da">
 *                <i class="be-flag-dk"></i>
 *                <input type="text" name="item[da]" lang="da" placeholder="New item">
 *            </div>
 *            <div class="locale" lang="en">
 *                <i class="be-flag-en"></i>
 *                <input type="text" name="item[en]" lang="en" placeholder="New item">
 *            </div>
 *        </new-item-input>
 *
 *        <input type="hidden" value="1" name="item">
 *   </div>
 *
 * @example JS
 *    $('.crud-dropdown-input-for-foobar').crudDropdownInput({
 *			// Provide URLs when not specified through data-attributes
 *			urls: {
 *				edit: '/item/',
 *				ajaxCreate: '/item/new',
 *				ajaxDelete: '/item/delete',
 *				ajaxSearch: '/item/search',
 *			},
 *			ajaxSelectRequestPayload: {
 *				productId: 3,
 *			},
 *			// Provide dependencies that are not available in `window`
 *			dependencies: {
 *				bootbox: require('bootbox'),
 *				lodash: require('lodash'),
 *			},
 *			translations: {
 *				add: _('Add'),
 *				confirmDelete: _('Are you sure to delete it?'),
 *			}
 * 	  );
 */
var _, $, bootbox;

if (typeof module === 'object' && module.exports) {
	_ = require('lodash');
	$ = require('jquery');
	bootbox = require('bootbox');
}

$.widget('gp.crudDropdownInput', {

	options: {

		urls: {
			edit: null,
			ajaxCreate: null,
			ajaxDelete: null,
			ajaxSearch: null,
			ajaxSelect: null,
		},
		ajaxSearchQuery: '*',
		ajaxCreateRequestDataKey: 'newItem',
		ajaxDeleteRequestPayload: {},
		ajaxSelectRequestPayload: {},

		createCallback: _.noop,
		initCallback: _.noop,
		responseCallbacks: {
			addSuccess: _.noop,
			deleteSuccess: _.noop,
			searchSuccess: _.noop,
			selectSuccess: _.noop,
		},

		translations: {
			add: 'Add',
			confirmDelete: 'Are you sure to delete it?',
		},
	},

	keycodes: {
		enter: 13,
		esc: 27,
		up: 38,
		down: 40,
		left: 37,
		right: 39,
	},

	selectors: {
		listItem: '.list-item',
		listItemText: '.list-item-text',
		listItemDelete: '.list-item-delete',
		listItemEdit: '.list-item-edit',
		listItemCheck: '.list-item-check',
	},

	listItems: [],

	formerId: null,

	/** @type {jQuery} */
	$container: null,
	/** @type {jQuery} */
	$dropdown: null,
	/** @type {jQuery} */
	$dropdownItemsList: null,
	/** @type {jQuery} */
	$dropdownToggle: null,
	/** @type {jQuery} */
	$dropdownMenu: null,
	/** @type {jQuery} */
	$input: null,
	/** @type {jQuery} */
	$inputSearchEraseButton: null,
	/** @type {jQuery} */
	$newTitleForm: null,
	/** @type {jQuery} */
	$newTitleFormDivider: null,
	/** @type {jQuery} */
	$loader: null,
	/** @type {jQuery} */
	$hiddenInput: null,

	/**
	 * Widget constructor
	 * @private
	 * @description
	 * The _create() method is the widget's constructor
	 * There are no parameters, but this.element and this.options are already set
	 * Here it is used to define options from data-attributes
	 */
	_create: function() {

		var widget = this;
		var options = this.options;
		var urls = this.options.urls;
		var $container = this.element;

		options.urls.edit = urls.edit || $container.data('edit');
		options.urls.ajaxCreate = urls.ajaxCreate || $container.data('create');
		options.urls.ajaxDelete = urls.ajaxDelete || $container.data('delete');
		options.urls.ajaxSearch = urls.ajaxSearch || $container.data('search');

		var $dropdown = $(
			'<div class="dropdown">'
			+ '	<span class="dropdown-toggle" data-toggle="dropdown">'
			+ '		<input type="text" class="form-control dropdown-toggle-input" autocomplete="off">'
			+ '		<i class="glyphicon glyphicon-search search-erase-button"></i>'
			+ '		<svg class="svg-loader" viewBox="0 0 32 32" width="32" height="32">'
			+ '			<circle id="spinner" cx="16" cy="16" r="14" fill="none"></circle>'
			+ '		</svg>'
			+ '	</span>'
			+ '	<ul class="dropdown-menu">'
			+ '		<li>'
			+ '			<ul class="items-list"></ul>'
			+ '		</li>'
			+ '		<li class="divider" role="separator"></li>'
			+ '		<li class="new-item-form-group">'
			+ '   		<button type="button" class="btn btn-primary btn-add"></button>'
			+ '		</li>'
			+ '	</ul>'
			+ '</div>'
		);

		// Transclusion slots
		var $dropdownToggleSlot = $container.find('> dropdown-toggle');
		var $newItemInputSlot = $container.find('> new-item-input');
		var $addButtonLabelSlot = $container.find('> add-button-label');

		var $label = $container.find('> label:first-child');
		var $newItemInput = $newItemInputSlot.find('input[type="text"]');
		var isMultipleInputs = $newItemInput.length > 1;

		var $dropdownToggle = $dropdown.find('> .dropdown-toggle');
		var $dropdownMenu = $dropdown.find('> .dropdown-menu');
		var $dropdownToggleInput = $dropdown.find('.dropdown-toggle-input');
		var $newItemFormGroup = $dropdown.find('.new-item-form-group');
		var $newItemAddButton = $newItemFormGroup.find('.btn-add');

		$container.append($dropdown);

		$newItemFormGroup
			.prepend($newItemInputSlot.children())
			.toggleClass('multiple-inputs', isMultipleInputs)
			.toggleClass('single-input', !isMultipleInputs)
		;

		if ($dropdownToggleSlot.length) {
			$dropdownToggle.empty().append($dropdownToggleSlot.children());
		}

		// remove empty elements
		$newItemInputSlot.remove();
		$dropdownToggleSlot.remove();

		_.assign(widget, {
			$container: $container,
			$dropdown: $dropdown,

			$dropdownToggle: $dropdownToggle,
			$input: $dropdownToggle.find('input'),
			$inputSearchEraseButton: $dropdownToggle.find('> .search-erase-button'),
			$loader: $dropdownToggle.find('> .svg-loader'),

			$dropdownMenu: $dropdownMenu,
			$dropdownItemsList: $dropdownMenu.find('.items-list'),
			$newTitleForm: $newItemFormGroup,
			$newTitleFormDivider: $dropdownMenu.find('> .divider'),

			$hiddenInput: $container.find('> input[type="hidden"]'),
		});

		$label.on('click', function() {
			$dropdownToggleInput.trigger('focus');
		});

		$newItemAddButton.html($addButtonLabelSlot.html() || options.translations.add);
		$addButtonLabelSlot.remove();

		widget._initList();
		widget._initInput();
		widget._buildNewTitleForm();

		this.options.createCallback(this);
	},

	/**
	 * Widget initialization/reinitialization
	 * @private
	 * @description
	 * Widgets have the concept of initialization that is distinct from creation.
	 * Any time the plugin is called with no arguments or with only an option hash,
	 * the widget is initialized; this includes when the widget is created.
	 *
	 * Note: Initialization should only be handled if there is a logical action
	 */
	_init: function() {

		this.options.initCallback(this);
	},

	/**
	 * Fetch tab titles from server or return existing
	 * @returns {Promise}
	 */
	getListItemsAjaxPromise: function() {

		var widget = this;
		var urls = this.options.urls;
		var promise;

		if (widget.listItems.length) {

			promise = $.Deferred().resolve(widget.listItems);

		} else {

			promise = $
				.ajax({
					url: urls.ajaxSearch,
					data: {q: widget.options.ajaxSearchQuery},
					dataType: 'json', // for response
				})
				.done(function ajaxSearchSuccess(data) {

					return data;
				})
			;
		}

		return promise;
	},

	/**
	 * Reinitialize titles in the dropdown
	 * Remove all list items and fetch fresh data from the server
	 * @param {Promise} [listItemsPromise]
	 * @return {Promise}
	 */
	reinitList: function(listItemsPromise) {

		var widget = this;

		widget.listItems = [];

		return widget._initList(listItemsPromise);
	},

	/**
	 * Populate list of tab titles dropdown and show it
	 * @private
	 * @param {Promise} [listItemsPromise]
	 * @return {Promise}
	 */
	_initList: function(listItemsPromise) {

		var widget = this;

		listItemsPromise = listItemsPromise || widget.getListItemsAjaxPromise();

		listItemsPromise.then(function ajaxGetListItemsSuccess(listItems) {

			widget.listItems = listItems;

			var options = widget.options;
			var selectors = widget.selectors;
			var urls = options.urls;
			var responseCallbacks = options.responseCallbacks;

			var listItemClass = _.trimStart(selectors.listItem, '.');
			var listItemTextClass = _.trimStart(selectors.listItemText, '.');
			var listItemCheckClass = _.trimStart(selectors.listItemCheck, '.');
			var listItemEditClass = _.trimStart(selectors.listItemEdit, '.');
			var listItemDeleteClass = _.trimStart(selectors.listItemDelete, '.');
			var $listItems = $();

			// Add list item for each title
			listItems.forEach(function listItemIterator(tabTitle) {

				$listItems = $listItems.add(
					'<li'
					+ '		class="' + listItemClass + '"'
					+ '		data-id="' + tabTitle.id + '"'
					+ '>'
					+ '	<a href="#" class="' + listItemTextClass + '">'
					+ '		' + tabTitle.name
					+ '	</a>'
					+ '	<a href="#" class="' + listItemCheckClass + '">'
					+ '		<i class="glyphicon glyphicon-ok"></i>'
					+ '	</a>'
					+ '	<a class="' + listItemEditClass + '"'
					+ '		title="Edit"'
					+ ' 	href="' + urls.edit + tabTitle.id + '/"'
					+ '		target="_blank"'
					+ '	>'
					+ '		<i class="glyphicon glyphicon-pencil"></i>'
					+ '	</a>'
					+ '	<a href="#" class="' + listItemDeleteClass + '">'
					+ '		<i class="glyphicon glyphicon-remove"></i>'
					+ '	</a>'
					+ '</li>'
				);
			});

			widget.$dropdownItemsList.empty().append($listItems);
			widget._updateInputValue();
			widget._filterList();
			widget._applyActiveItem();
			responseCallbacks.searchSuccess(widget);

			var $checkButtons = $listItems.find(selectors.listItemCheck);
			var $deleteButtons = $listItems.find(selectors.listItemDelete);

			// Select title from dropdown
			$listItems.on('click', function listItemClickHandler(event) {

				const $listItem = $(this);
				const $link = $(event.target).closest('a');
				const linkHref = $link.attr('href');

				// Prevent page scroll
				if (!linkHref || linkHref === '#') {
					event.preventDefault();
				}

				widget._selectListItem($listItem);
				widget.$input.focus();
				widget._hideDropdown();
			});

			// Unselect an item
			$checkButtons.on('click', function checkClickHandler() {

				widget._selectListItem(null);
				event.stopPropagation();
			});

			// Delete title from dropdown
			$deleteButtons.on('click', function deleteClickHandler(event) {

				var $delete = $(this);

				// Prevent item selection
				event.stopPropagation();

				bootbox.confirm(widget.options.translations.confirmDelete, function(okDelete) {

					if (!okDelete) {
						return;
					}

					var $listItem = $delete.closest('li');
					var id = $listItem.data('id');

					var requestPayload = _.assign(
						{id: id},
						options.ajaxDeleteRequestPayload
					);

					$listItem.remove();
					widget.$inputSearchEraseButton.hide();
					widget.$loader.show();

					$
						.ajax({
							type: 'POST',
							url: urls.ajaxDelete,
							data: requestPayload,
						})
						.done(function ajaxDeleteSuccess(response) {

							if (response.success) {

								var promise = widget.reinitList();

								widget._clearInput();

								responseCallbacks.deleteSuccess(widget, promise);

							} else {
								bootbox.alert(response.message);
							}
						})
						.always(function ajaxDeleteFinally() {
							widget.$inputSearchEraseButton.show();
							widget.$loader.hide();
						})
					;
				});
			});
		});

		return listItemsPromise;
	},

	/**
	 * Set focus on the input field
	 * @private
	 */
	_focusInput: function() {

		var widget = this;

		// Timeout is required after toggling the dropdown
		// because the Bootstrap dropdown plugin sets the focus
		// on a dropdown item within the current call stack
		window.setTimeout(function() {
			widget.$input.focus();
		});
	},

	/**
	 * Setup event handlers for tab title input field
	 * @private
	 */
	_initInput: function() {

		var widget = this;
		var keycodes = this.keycodes;

		console.log(widget.$input);
		widget.$input

			.on('click', function inputClickHandler() {

				if (!widget._isDropdownOpen()) {
					widget._filterList();
					widget._focusInput();
				}
			})

			.on('keypress', function inputKeypressHandler(event) {

				// Prevent submitting the form on enter key
				if (event.which === keycodes.enter) {
					return false;
				}
			})

			.on('keyup', function inputKeyupHandler(event) {

				event.stopPropagation();

				// Don't open dropdown when navigating within input field
				if (_.includes([keycodes.left, keycodes.right], event.which)) {
					return;
				}

				// Close dropdown on Esc key
				if (event.which === keycodes.esc) {
					debugger;
					widget._hideDropdown({restoreFormerValue: true});
					return;
				}

				var selectors = widget.selectors;
				var title = widget.$input.val();

				widget._filterList();
				widget._showDropdown();
				widget.$newTitleForm.find('input').val(title);

				// Select item from dropdown on enter key
				if (event.which === keycodes.enter) {

					var $active = widget._getActiveListItem();

					if (!$active.length) {
						widget.$newTitleForm.find('.btn-add').click();
					}

					widget._hideDropdown();
				}

				// Focus first/last element in the dropdown after pressing up/down keys
				if (_.includes([keycodes.up, keycodes.down], event.which)) {

					var isDownKey = (event.which === keycodes.down);
					var $titles = widget.$dropdownMenu.find(selectors.listItemText + ':visible');
					var $titleToFocus;

					if ($titles.length) {

						// Select first or last item in dropdown depending on which key (up or down) is pressed
						$titleToFocus = $titles[isDownKey ? 'first' : 'last']();

						// Skip active item
						if ($titleToFocus.parent().is('.active')) {
							$titleToFocus = $titles.eq(isDownKey ? 2 : -2);
						}

					} else {
						// Select first input field when typing new title
						$titleToFocus = widget.$dropdownMenu.find('input').first();
					}

					$titleToFocus.focus();
				}
			})
		;

		// Clear input field
		widget.$inputSearchEraseButton.on('click', function inputClearClickHandler() {

			if (widget.$inputSearchEraseButton.is('.glyphicon-erase')) {

				widget._clearInput();

				// This button triggers the Bootstrap dropdown plugin toggle event
				// thus we need to open it after the current call stack
				window.setTimeout(function() {
					widget._filterList();
					widget._showDropdown();
				});
			}

			widget._focusInput();
		});
	},

	/**
	 * Show dropdown if closed
	 * @private
	 * @description
	 * Before showing the dropdown it updates the filtered
	 * list by using the current title as the query
	 * and updates the input value in the new title form
	 */
	_showDropdown: function() {

		var widget = this;

		if (!widget._isDropdownOpen()) {

			widget.$dropdownToggle.dropdown('toggle');
			widget.formerId = widget.getActiveId();
			widget._focusInput();
		}
	},

	/**
	 * Hide dropdown
	 * @private
	 * @param {Object} [options]
	 * @param {boolean} [options.restoreFormerValue]
	 */
	_hideDropdown: function(options) {

		var widget = this;

		options = options || {};

		if (widget._isDropdownOpen()) {

			widget.$dropdownToggle.dropdown('toggle');

			if (options.restoreFormerValue) {
				widget._setActiveId(widget.formerId);
				widget._applyActiveItem();
			}
		}
	},

	/**
	 * Clear input field
	 * @private
	 */
	_clearInput: function() {

		var widget = this;

		widget._setActiveId(null);
		widget._applyActiveItem();
	},

	/**
	 * Check whether dropdown is open
	 * @private
	 * @return {boolean}
	 */
	_isDropdownOpen: function() {
		return this.$dropdown.is('.open');
	},

	/**
	 * Get active value's id
	 * @returns {number}
	 */
	getActiveId: function() {
		return Number(this.$hiddenInput.val());
	},

	/**
	 * Get active value's id
	 * @returns {number}
	 */
	getActiveText: function() {

		var widget = this;

		var $activeListItem = widget._getActiveListItem();
		var $activeListItemLabel = $activeListItem.find(widget.selectors.listItemText);

		return $activeListItemLabel.text().trim();
	},

	/**
	 * Set id of active value
	 * @private
	 * @param {number|null} [activeId] Will be removed if empty
	 */
	_setActiveId: function(activeId) {
		this.$hiddenInput.val(_.isNil(activeId) ? '' : activeId);
	},

	/**
	 * Get list item that is marked as active
	 * @private
	 * @returns {jQuery} Active list item
	 */
	_getActiveListItem: function() {

		var $listItems = this.$dropdownItemsList.children();

		var $activeListItem = $listItems.filter(function() {
			return $(this).is('.active');
		});

		return $activeListItem;
	},

	/**
	 * Add active class to active list item
	 * @private
	 */
	_markActiveListItem: function() {

		var widget = this;

		var activeId = widget.getActiveId();
		var $listItems = widget.$dropdownItemsList.children();

		$listItems.each(function() {

			var $listItem = $(this);
			var listItemId = Number($listItem.data('id'));

			$listItem.toggleClass('active', listItemId === activeId);
		});
	},

	/**
	 * Update widget according to the values of active item
	 * @private
	 */
	_applyActiveItem: function() {

		var widget = this;

		if (widget.$input.length) {

			// Update the input field with active item title
			widget._updateInputValue();

			// Toggles search/erase icon
			widget._toggleSearchIcon();
		}

		// Mark selected list item with `active` class
		widget._markActiveListItem();
	},

	/**
	 * Update input field with current title (from hidden input)
	 * @private
	 */
	_updateInputValue: function() {

		var widget = this;

		var activeId = widget.getActiveId();
		var currentTitle = '';

		widget.listItems.forEach(function(tabTitle) {

			if (tabTitle.id === activeId) {
				currentTitle = tabTitle.name;
			}
		});

		widget.$input.val(currentTitle);
	},

	/**
	 * Toggle list items and new title form visibility in the dropdown
	 * according to the query string in the title input
	 *
	 * @private
	 */
	_filterList: function() {

		var widget = this;

		if (!widget.$input.length) {
			return;
		}

		var query = widget.$input.val();
		var $matchedEls = widget._matchInputActiveTitle(query);

		// Show only items that matches query from the input field
		widget._hideTitleEls();
		$matchedEls.removeClass('hidden');

		var $active = widget._getActiveListItem();

		// Hide the New title form when there is a title with exact match
		widget.$newTitleForm.toggle(!$active.length);
		widget.$newTitleFormDivider.toggleClass('hidden', !!$active.length);

		// Hide divider when there are no matching titles
		if (!$matchedEls.length) {
			widget.$newTitleFormDivider.addClass('hidden');
		}

		widget._markActiveListItem();
		widget._toggleSearchIcon();
	},

	/**
	 * Hide the list of tab titles
	 *
	 * @private
	 */
	_hideTitleEls: function() {
		this.$dropdownItemsList.children().addClass('hidden');
	},

	/**
	 * Actions on item activation
	 * @private
	 * @param {jQuery|null} $selectedListItem
	 */
	_selectListItem: function($selectedListItem) {

		var widget = this;
		var options = this.options;
		var urls = this.options.urls;

		var selectedId = $($selectedListItem).data('id');

		// Set active id to the hidden input field
		widget._setActiveId(selectedId);

		widget._applyActiveItem();

		if (urls.ajaxSelect) {

			var requestPayload = _.assign(
				{id: selectedId},
				options.ajaxSelectRequestPayload
			);

			$
				.ajax({
					type: 'POST',
					url: urls.ajaxSelect,
					data: requestPayload,
				})
				.done(function ajaxSelectSuccess() {

					widget.options.responseCallbacks.selectSuccess(widget);
				})
			;
		}
	},

	/**
	 * Show clear icon instead of search when input field is not empty
	 * @private
	 */
	_toggleSearchIcon: function() {

		var widget = this;
		var isEmptyField = (widget.$input.val().trim() === '');

		widget.$inputSearchEraseButton
			.toggleClass('glyphicon-search', isEmptyField)
			.toggleClass('glyphicon-erase', !isEmptyField)
		;
	},

	/**
	 * Find matching titles in the list (case-insensitive)
	 * Set active id in the hidden input field
	 * and mark list item with active class
	 *
	 * @private
	 * @param {string} term
	 * @returns {jQuery}
	 */
	_matchInputActiveTitle: function(term) {

		var widget = this;
		var selectors = this.selectors;

		var $listItems = widget.$dropdownItemsList.children();
		var matchingId = null;

		var $matching = $listItems.filter(function() {

			var $listItem = $(this);
			var $title = $listItem.find(selectors.listItemText);
			var title = $title.text().trim();
			var isTitleMatch = (new RegExp(term, 'gi')).test(title);
			var isExactMatch = (new RegExp('^' + term.trim() + '$', 'i')).test(title);

			if (isExactMatch) {
				matchingId = $listItem.data('id');
			}

			return isTitleMatch;
		});

		widget._setActiveId(matchingId);
		widget._markActiveListItem();

		return $matching;
	},

	/**
	 * Form for localized tab title
	 * @private
	 */
	_buildNewTitleForm: function() {

		var widget = this;
		var options = this.options;
		var responseCallbacks = this.options.responseCallbacks;
		var keycodes = this.keycodes;
		var urls = this.options.urls;

		var $newTitleInputs = widget.$newTitleForm.find('input');
		var $newTitleAddButton = widget.$newTitleForm.find('.btn-add');

		$newTitleInputs.on('keypress', function(event) {

			if (event.which === keycodes.enter) {
				event.preventDefault();
				widget.$newTitleForm.find('.btn-add').click();
			}
		});

		$newTitleAddButton.on('click', function(event) {

			event.preventDefault();

			var $button = $(this);
			var data = {};

			widget.$newTitleForm.find('input').each(function() {

				var $input = $(this);
				var lang = $input.attr('lang');

				if (lang) {
					data[lang] = $input.val().trim();
				} else {
					data = $input.val().trim();
				}
			});

			// prevent sending request if nothing is entered
			if ('' === _.values(data).join('')) {
				return;
			}

			$button.addClass('disabled');
			widget.$inputSearchEraseButton.hide();
			widget.$loader.show();

			var requestPayload = {};

			requestPayload[options.ajaxCreateRequestDataKey] = data;

			$
				.ajax({
					type: 'POST',
					url: urls.ajaxCreate,
					data: requestPayload,
					dataType: 'json', // for response
				})
				.done(function ajaxCreateSuccess(response) {

					if (response.success) {

						var promise = widget.reinitList();

						widget.$input.val(response.name);
						widget._setActiveId(response.id);

						responseCallbacks.addSuccess(widget, promise);
					}
					else {
						bootbox.alert(response.message);
					}
				})
				.always(function ajaxCreateFinally() {
					$button.removeClass('disabled');
					widget.$inputSearchEraseButton.show();
					widget.$loader.hide();
				})
			;
		});
	},
});
