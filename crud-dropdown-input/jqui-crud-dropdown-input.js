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
 *         data-url-edit="{{ path('BEFoobar') }}"
 *         data-url-ajax-search="{{ path('BEFoobarSearchAjax') }}"
 *         data-url-ajax-select="{{ path('BEFoobarSelectAjax') }}"
 *         data-url-ajax-create="{{ path('BEFoobarNewAjax') }}"
 *         data-url-ajax-delete="{{ path('BEFoobarDeleteAjax') }}"
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
 *        <input type="hidden" name="item" value="1">
 *   </div>
 *
 * @example JS
 *    $('.crud-dropdown-input-for-foobar').crudDropdownInput({
 *			// Provide URLs when not specified through data-attributes
 *			urls: {
 *				edit: '/item/',
 *				ajaxSearch: '/item/search',
 *				ajaxCreate: '/item/new',
 *				ajaxDelete: '/item/delete',
 *			},
 *			ajaxRequestPayload: {
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

		isFiltered: true,
		isMultiple: null,

		urls: {
			edit: null,
			select: null,
			ajaxSearch: null,
			ajaxSelect: null,
			ajaxCreate: null,
			ajaxDelete: null,
		},

		ajaxSearchQuery: '*',
		ajaxRequestPayload: null,
		ajaxSearchRequestPayload: null,
		ajaxSelectRequestPayload: null,
		ajaxCreateRequestDataKey: 'value',
		ajaxCreateRequestPayload: null,
		ajaxDeleteRequestPayload: null,

		hiddenInputName: null,
		hiddenInputId: null,

		createCallback: _.noop,
		initCallback: _.noop,
		responseCallbacks: {
			searchSuccess: _.noop,
			selectSuccess: _.noop,
			createSuccess: _.noop,
			deleteSuccess: _.noop,
		},

		translations: {
			add: 'Add',
			confirmDelete: 'Are you sure to delete it?',
		},

		groupPromise: null,
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

	formerIds: [],

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
	$newItemFormGroup: null,
	/** @type {jQuery} */
	$newItemFormDivider: null,
	/** @type {jQuery} */
	$loader: null,

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

		// Options that are specified in JS have higher priority than `data-*` attributes
		options.urls.edit = urls.edit || $container.data('url-edit');
		options.urls.select = urls.select || $container.data('url-select');
		options.urls.ajaxSearch = urls.ajaxSearch || $container.data('url-ajax-search');
		options.urls.ajaxSelect = urls.ajaxSelect || $container.data('url-ajax-select');
		options.urls.ajaxCreate = urls.ajaxCreate || $container.data('url-ajax-create');
		options.urls.ajaxDelete = urls.ajaxDelete || $container.data('url-ajax-delete');
		options.hiddenInputName = options.hiddenInputName || $container.data('hidden-input-name');

		if (_.isNil(options.isMultiple)) {
			options.isMultiple = $container.is('[data-multiple]');
		}

		options.isDropup = $container.is('[data-dropup]');

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

		var $dropdownToggle = $dropdown.find('> .dropdown-toggle');
		var $dropdownMenu = $dropdown.find('> .dropdown-menu');
		var $dropdownToggleInput = $dropdown.find('.dropdown-toggle-input');
		var $newItemFormGroup = $dropdown.find('.new-item-form-group');
		var $newItemAddButton = $newItemFormGroup.find('.btn-add');

		$container.append($dropdown);

		// Slot with new item inputs
		$newItemFormGroup.prepend($newItemInputSlot.children());

		// Slot with content for dropdown toggle
		if ($dropdownToggleSlot.length) {
			$dropdownToggle.empty().append($dropdownToggleSlot.children());
		}

		// Slot with content for "Add new item" button
		$newItemAddButton.html($addButtonLabelSlot.html() || options.translations.add);

		// Remove empty/used elements
		$newItemInputSlot.remove();
		$dropdownToggleSlot.remove();
		$addButtonLabelSlot.remove();

		// Add dropup class for dropdowns that must be opened upwards
		options.isDropup && $dropdown.addClass('dropup');

		_.assign(widget, {
			$container: $container,
			$dropdown: $dropdown,

			$dropdownToggle: $dropdownToggle,
			$input: $dropdownToggle.find('input'),
			$inputSearchEraseButton: $dropdownToggle.find('> .search-erase-button'),
			$loader: $dropdownToggle.find('> .svg-loader'),

			$dropdownMenu: $dropdownMenu,
			$dropdownItemsList: $dropdownMenu.find('.items-list'),
			$newItemFormGroup: $newItemFormGroup,
			$newItemFormDivider: $dropdownMenu.find('> .divider'),
		});

		if (!widget.$input.length) {
			options.isFiltered = false;
		}

		if (!options.hiddenInputName) {

			var $hiddenInputs = widget._getHiddenInputs();

			options.hiddenInputName = $hiddenInputs.attr('name') || ('crud_dropdown_input_' + _.random(9999));

			if (!options.isMultiple) {
				options.hiddenInputId = $hiddenInputs.attr('id');
			}
		}

		// Add classes for widget behaviours
		widget.$container.toggleClass('single-selection', !options.isMultiple);
		widget.$container.toggleClass('multiple-selection', options.isMultiple);
		widget.$container.toggleClass('filtered-list', options.isFiltered);
		widget.$container.toggleClass('not-filtered-list', !options.isFiltered);
		widget.$container.toggleClass('items-are-links', !!options.urls.select);

		$label.on('click', function() {
			$dropdownToggleInput.trigger('focus');
		});

		widget._initList(options.groupPromise);
		widget._initInput();
		widget._initNewItemForm();

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

			var requestPayload = _.assign(
				{q: widget.options.ajaxSearchQuery},
				widget.options.ajaxRequestPayload,
				widget.options.ajaxSearchRequestPayload
			);

			promise = $
				.ajax({
					url: urls.ajaxSearch,
					data: requestPayload,
					dataType: 'json', // for response
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

	refreshValues: function () {
		var widget = this;
		const currentElements = widget.getActiveIds();
		widget.reinitList();
		widget._setActiveIds(currentElements);
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

		listItemsPromise.then(function ajaxSearchSuccess(listItems) {

			if (!_.isArray(listItems)) {
				console.error('gp.crudDropdownInput: Response does not contain array of items', listItems);
				return;
			}

			widget.listItems = listItems;

			var options = widget.options;
			var keycodes = widget.keycodes;
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
			listItems.forEach(function listItemIterator(listItem) {

				var $listItem = $(
					'<li'
					+ '	class="' + listItemClass + '"'
					+ '	data-id="' + listItem.id + '"'
					+ '></li>'
				);

				var urlSelect = urls.select ? (urls.select + listItem.id + '/') : '#';

				$listItem.append(
					'<a href="' + urlSelect + '" class="' + listItemTextClass + '">'
					+ '		' + listItem.name
					+ '</a>'
				);

				$listItem.append(
					'<a href="#" class="' + listItemCheckClass + '">'
					+ '		<i class="glyphicon glyphicon-remove"></i>'
					+ '</a>'
				);

				if (urls.edit) {

					$listItem.append(
						'<a class="' + listItemEditClass + '"'
						+ '		title="Edit"'
						+ ' 	href="' + urls.edit + listItem.id + '/"'
						+ '		target="_blank"'
						+ '>'
						+ '		<i class="glyphicon glyphicon-pencil"></i>'
						+ '</a>'
					);
				}

				$listItem.append(
					'<a href="#" class="' + listItemDeleteClass + '">'
					+ '		<i class="glyphicon glyphicon-trash"></i>'
					+ '</a>'
				);

				$listItems = $listItems.add($listItem);
			});

			widget.$dropdownItemsList.empty().append($listItems);
			widget._updateInputValue();
			widget._filterListByInputValue();
			widget._applyActiveItems();
			widget._toggleListItemsVisibilityClass();
			responseCallbacks.searchSuccess(widget, listItems);

			var $checkButtons = $listItems.find(selectors.listItemCheck);
			var $editButtons = $listItems.find(selectors.listItemEdit);
			var $deleteButtons = $listItems.find(selectors.listItemDelete);
			var $listItemTexts = $listItems.find(selectors.listItemText);

			// Select title from dropdown
			$listItems.on('click', function listItemClickHandler(event) {

				if (widget.options.urls.select) {
					return;
				}

				var $listItem = $(this);
				var $link = $(event.target).closest('a');
				var linkHref = $link.attr('href');

				// Prevent page scroll
				if (!linkHref || linkHref === '#') {
					event.preventDefault();
				}

				if (widget.options.isMultiple) {

					widget._selectListItem($listItem, {
						shouldDeselect: $listItem.is('.active'),
					});

				} else {

					widget._selectListItem($listItem);
					widget._focusInput();
				}

				widget._hideDropdown();
			});

			// Deselect/uncheck an item
			$checkButtons.on('click', function checkClickHandler(event) {

				if (widget.options.urls.select) {
					return;
				}

				var $listItem = $(this).closest('.list-item');

				widget._selectListItem($listItem, {shouldDeselect: true});
				widget._filterListByInputValue();

				event.preventDefault();
				event.stopPropagation();
			});

			// Edit item link
			$editButtons.on('click', function editClickHandler(event) {

				// Prevent item selection
				event.stopPropagation();
			});

			// Delete title from dropdown
			$deleteButtons.on('click', function deleteClickHandler(event) {

				var $delete = $(this);

				// Prevent scroll
				event.preventDefault();

				// Prevent item selection
				event.stopPropagation();

				bootbox.confirm(widget.options.translations.confirmDelete, function confirmDelete(okDelete) {

					if (!okDelete) {
						return;
					}

					var $listItem = $delete.closest('li');
					var id = $listItem.data('id');

					var requestPayload = _.assign(
						{id: id},
						options.ajaxRequestPayload,
						options.ajaxDeleteRequestPayload
					);

					$listItem.remove();
					widget._unsetActiveId(id);

					widget._clearInput();
					widget.$inputSearchEraseButton.hide();
					widget.$loader.show();

					$
						.ajax({
							type: 'POST',
							url: urls.ajaxDelete,
							data: requestPayload,
						})
						.then(function ajaxDeleteSuccess(response) {

							if (response.success) {

								var promise = widget.reinitList();

								responseCallbacks.deleteSuccess(widget, promise, response);

							} else {
								bootbox.alert(response.message);
							}
						})
						.always(function ajaxDeleteFinally() {

							widget.$inputSearchEraseButton.show();
							widget.$loader.hide();
							widget._focusInput();
						})
					;
				});
			});

			$listItemTexts.on('keydown', function inputKeydownHandler(event) {

				var $listItemText = $(this);
				var $listItem = $listItemText.parent();
				var listItemIndex = $listItem.index();

				// Focus first/last element in the dropdown after pressing up/down keys
				if (_.includes([keycodes.up, keycodes.down], event.which)) {

					event.stopPropagation();

					var $listItems = widget.$dropdownMenu.find(widget.selectors.listItem + ':visible');
					var isDownKey = (event.which === keycodes.down);

					if (isDownKey) {
						if (listItemIndex === $listItems.length - 1) {
							widget.$newItemFormGroup.find('input').first().focus();
							return;
						}
					} else {
						if (listItemIndex === 0) {
							widget.$input.focus();
							return;
						}
					}

					var $listItemToFocus;

					// Select next/prev item in dropdown depending on which key (up or down) is pressed
					$listItemToFocus = $listItem[isDownKey ? 'next' : 'prev']();

					$listItemToFocus.find(widget.selectors.listItemText).focus();
				}
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

			if (widget.options.isFiltered) {
				widget.$input.focus();
			} else {
				widget.$newItemFormGroup.find('input').first().focus();
			}
		});
	},

	/**
	 * Setup event handlers for tab title input field
	 * @private
	 */
	_initInput: function() {

		var widget = this;
		var keycodes = this.keycodes;

		widget.$input

			.on('click', function inputClickHandler() {

				if (!widget._isDropdownOpen()) {

					// A dropdown toggle button is clicked, prevent closing it
					// by specifying the `doNotToggle` parameter
					widget._showDropdown(true);
				}
			})

			.on('keypress', function inputKeypressHandler(event) {

				// Prevent submitting the form on enter key
				if (event.which === keycodes.enter) {
					return false;
				}
			})

			.on('keydown', function inputKeydownHandler(event) {

				// Focus first/last element in the dropdown after pressing up/down keys
				if (_.includes([keycodes.up, keycodes.down], event.which)) {

					var isDownKey = (event.which === keycodes.down);
					var $titles = widget.$dropdownMenu.find(widget.selectors.listItemText + ':visible');
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

			.on('keyup', function inputKeyupHandler(event) {

				event.stopPropagation();

				// Don't open dropdown when navigating within input field
				if (_.includes([keycodes.left, keycodes.right], event.which)) {
					return;
				}

				// Close dropdown on Esc key
				if (event.which === keycodes.esc) {
					widget._hideDropdown({restoreFormerValue: true});
					return;
				}

				var query = widget.$input.val();

				widget._showDropdown();
				widget.$newItemFormGroup.find('input').val(query);

				// Select item from dropdown on enter key
				if (event.which === keycodes.enter) {

					var shouldAddNewItem = true;

					// When only single item can be selected then new item
					// must not be added when there's an active item in the list
					if (!widget.options.isMultiple) {

						shouldAddNewItem = !widget.getActiveIds().length;

						// Update input value because of case-insensitive title matching
						if (!shouldAddNewItem) {
							widget.$input.val(widget.getActiveTitles()[0]);
						}
					}

					if (shouldAddNewItem) {
						widget.$newItemFormGroup.find('.btn-add').click();
					}

					widget._hideDropdown();
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
					widget._filterListByInputValue();
					widget._showDropdown();
				});
			}

			widget._focusInput();
		});
	},

	/**
	 * Show dropdown if closed
	 * @private
	 * @param {boolean} [doNotToggle]
	 * @description
	 * Before showing the dropdown it updates the filtered
	 * list by using the current title as the query
	 * and updates the input value in the new title form
	 */
	_showDropdown: function(doNotToggle) {

		var widget = this;

		widget._filterListByInputValue();

		if (!widget._isDropdownOpen()) {

			if (!doNotToggle) {
				widget.$dropdownToggle.dropdown('toggle');
			}

			widget.formerIds = widget.getActiveIds();
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
				widget._setActiveIds(widget.formerIds);
				widget._applyActiveItems();
			}
		}
	},

	/**
	 * Clear input field
	 * @private
	 */
	_clearInput: function() {

		var widget = this;

		widget.$input.val('');
		widget._filterListByInputValue();
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
	 * @returns {number[]}
	 */
	getActiveIds: function() {

		var widget = this;

		var activeIds = [];
		var $hiddenInputs = widget._getHiddenInputs();

		$hiddenInputs.each(function() {

			var activeId = $(this).val();

			activeId = activeId ? Number(activeId) : null;

			activeIds.push(activeId);
		});

		return _.without(activeIds, null);
	},

	/**
	 * Get active value titles
	 * @returns {string[]}
	 */
	getActiveTitles: function() {

		var widget = this;

		var $activeListItems = widget._getActiveListItems();
		var activeItemTitles = [];

		$activeListItems.each(function() {

			var $activeListItem = $(this);
			var $activeListItemLabel = $activeListItem.find(widget.selectors.listItemText);

			activeItemTitles.push($activeListItemLabel.text().trim());
		});

		return activeItemTitles;
	},

	/**
	 * Set/update id(s) of active value(s)
	 * @private
	 * @param {number[]} activeIds
	 */
	_setActiveIds: function(activeIds) {

		var widget = this;

		var $hiddenInputs = widget._getHiddenInputs();
		var inputName = widget.options.hiddenInputName;
		var inputId = widget.options.hiddenInputId;

		if (widget.options.isMultiple) {
			widget.$container.find('option').each(function () {
				this.selected = activeIds.includes(Number(this.value));
			});
			var currentInputsValues = [];
			widget._getHiddenInputs().each(function () {
				currentInputsValues.push(Number(this.value));
			});

			if(currentInputsValues.length < activeIds.length) {
				var $lastOption = widget.$container.find('option').last();
				var missingValues = activeIds.filter(function (x) {
					return !currentInputsValues.includes(x)
				});
				missingValues.forEach(function (missingValue) {
					var $missedOption = $lastOption.clone();
					var item = widget.listItems.find(function (x) {
						return x.id === missingValue
					});
					$missedOption.val(missingValue)
						.attr("selected", "selected")
						.text(item ? item.title : widget.$input.val());

					$lastOption.after($missedOption);
				});
			}
			return;
		}
		if (!$hiddenInputs.length) {

			// At least one hidden input field must be added when no item is selected
			(activeIds.length ? activeIds : ['']).forEach(function(activeId) {

				widget.$container.append(
					'<input type="hidden"'
					+ '	name="' + inputName + '"'
					+ (inputId ? (' id="' + inputId + '"') : '')
					+ '	value="' + (activeId || '') + '"'
					+ '>'
				);
			});

		} else {

			$hiddenInputs.val(activeIds[0] || '');
		}
	},

	/**
	 * Add active id
	 * @param {number} id
	 * @private
	 */
	_setActiveId: function(id) {

		var widget = this;
		var activeIds = widget.getActiveIds();

		activeIds.push(id);

		widget._setActiveIds(activeIds);
		widget.$container.trigger("dropdown.enable", [id]);
	},

	/**
	 * Remove active id
	 * @param {number} id
	 * @private
	 */
	_unsetActiveId: function(id) {

		var widget = this;
		var activeIds = widget.getActiveIds();

		_.pull(activeIds, id);

		widget._setActiveIds(activeIds);
		widget.$container.trigger("dropdown.disable", [id]);
	},

	/**
	 * Get list item(s) that is marked as active
	 * @private
	 * @returns {jQuery} Active list item
	 */
	_getActiveListItems: function() {

		var $activeListItems = this.$dropdownItemsList.children('.active');

		return $activeListItems;
	},

	/**
	 * Define whether an element with same title already exists
	 * @private
	 * @param {string} name
	 * @return {boolean}
	 */
	_hasItemWithName: function(name) {

		var widget = this;
		var hasItem;

		hasItem = widget.listItems.some(function(listItem) {

			return (listItem.name === name);
		});

		return hasItem;
	},

	/**
	 * Select item with specified title
	 * @private
	 * @param {string} name
	 */
	_selectItemWithName: function(name) {

		var widget = this;
		var selectedItemIndex;

		widget.listItems.some(function(listItem) {

			if (listItem.name === name) {

				selectedItemIndex = listItem.id;
				return true;
			}
		});

		if (selectedItemIndex !== undefined) {

			var $listItem = widget.$dropdownItemsList.children('[data-id="' + selectedItemIndex + '"]');

			widget._selectListItem($listItem);
		}
	},

	/**
	 * Get hidden inputs
	 * @private
	 * @return {jQuery}
	 */
	_getHiddenInputs: function() {

		if (this.options.isMultiple) {
			return this.$container.find("option:selected")
		}

		return this.$container.find('> input[type="hidden"]');
	},

	/**
	 * Add active class to active list item(s)
	 * @private
	 */
	_markActiveListItems: function() {

		var widget = this;

		var activeIds = widget.getActiveIds();
		var $listItems = widget.$dropdownItemsList.children();

		$listItems.each(function() {

			var $listItem = $(this);
			var listItemId = ($listItem.data('id') === '') ? null : Number($listItem.data('id'));

			$listItem.toggleClass('active', _.includes(activeIds, listItemId));
		});
	},

	/**
	 * Update widget according to the values of active item
	 * @private
	 */
	_applyActiveItems: function() {

		var widget = this;

		// Update the input field with active item title
		widget._updateInputValue();

		// Toggles search/erase icon
		widget._toggleSearchIcon();

		// Mark selected list item with `active` class
		widget._markActiveListItems();
	},

	/**
	 * Update input field with current title (from hidden input)
	 * @private
	 */
	_updateInputValue: function() {

		var widget = this;

		var activeIds = widget.getActiveIds();
		var itemTitles = [];

		widget.listItems.forEach(function(listItem) {

			if (_.includes(activeIds, listItem.id)) {
				itemTitles.push(listItem.name);
			}
		});

		widget.$input.val(itemTitles.join(', '));
	},

	/**
	 * Toggle list items and new title form visibility in the dropdown
	 * according to the query string in the title input
	 *
	 * @private
	 *
	 * @description
	 * Find matching titles in the list (case-insensitive)
	 * Set active id in the hidden input field
	 * and mark list item with active class
	 */
	_filterListByInputValue: function() {

		var widget = this;
		var selectors = this.selectors;

		var $listItems = widget.$dropdownItemsList.children();
		var query = widget._escapeRegExp(widget.$input.val());
		var showAlreadySelected = !!widget.options.isMultiple;
		var matchingId = showAlreadySelected ? widget.getActiveIds() : [];

		// Find list items that match query in a filtered list
		var $matchingListItem = $listItems.filter(function() {

			var $listItem = $(this);
			var $title = $listItem.find(selectors.listItemText);
			var title = $title.text().trim();
			var isTitleMatch = (new RegExp(query, 'gi')).test(title);
			var isExactMatch = (new RegExp('^' + query.trim() + '$')).test(title);
			const itemId = +$listItem.data('id');

			if (showAlreadySelected) {
				return ~widget.getActiveIds().indexOf(itemId) || isTitleMatch;
			}

			// TODO Make items selected by ID
			if (isExactMatch && title) {
				matchingId = [itemId];
			}

			return isTitleMatch;
		});

		widget._setActiveIds(matchingId);
		widget._markActiveListItems();

		var hasActiveItem = !!matchingId.length;

		if (query) {

			// Show only items that matches query from the input field
			$listItems.addClass('hidden');
			$matchingListItem.removeClass('hidden');

		} else {

			// Show all items when there's no query string
			$listItems.removeClass('hidden');
		}

		// Hide the New title form along with divider when there is an active item
		if(showAlreadySelected) {
			widget.$dropdownItemsList.parent()
				.toggleClass('has-active-item', false)
				.toggleClass('no-active-item', true)
			;
		} else {
			widget.$dropdownItemsList.parent()
				.toggleClass('has-active-item', hasActiveItem)
				.toggleClass('no-active-item', !hasActiveItem)
			;
		}

		widget._toggleSearchIcon();

		// Boostrap dropdown contents will appear after current call stack
		// (when called after `_showDropdown`)
		window.setTimeout(function() {
			widget._toggleListItemsVisibilityClass();
		});
	},

	/**
	 * Escape user input to be treated as a literal string (grabbed from MDN)
	 *
	 * @private
	 * @param {string} string
	 * @return {string}
	 */
	_escapeRegExp: function(string) {

		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	},

	/**
	 * Actions on item activation
	 * @private
	 * @param {jQuery|null} $selectedListItem
	 * @param {Object} [params]
	 * @param {boolean} [params.shouldDeselect]
	 */
	_selectListItem: function($selectedListItem, params) {

		params = params || {};

		var widget = this;
		var options = this.options;
		var urls = this.options.urls;

		var selectedId = Number($($selectedListItem).data('id'));

		if (params.shouldDeselect) {
			widget._unsetActiveId(selectedId);
		} else {
			widget._setActiveId(selectedId);
		}

		// Set active id to the hidden input field
		widget._applyActiveItems();

		if (urls.ajaxSelect) {

			var requestPayload = _.assign(
				{
					id: selectedId,
					deselect: params.shouldDeselect,
				},
				options.ajaxRequestPayload,
				options.ajaxSelectRequestPayload
			);

			$
				.ajax({
					type: 'POST',
					url: urls.ajaxSelect,
					data: requestPayload,
				})
				.then(function ajaxSelectSuccess(response) {

					widget.options.responseCallbacks.selectSuccess(widget, response);
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

		if (widget.options.isMultiple) {
			return;
		}

		var inputValue = (widget.$input.val() || '');
		var isEmptyField = (inputValue.trim() === '');

		widget.$inputSearchEraseButton
			.toggleClass('glyphicon-search', isEmptyField)
			.toggleClass('glyphicon-erase', !isEmptyField)
		;
	},

	/**
	 * Toggle the 'no-visible-items' class to signify list items visibility
	 * @private
	 */
	_toggleListItemsVisibilityClass: function() {

		var widget = this;

		var hasVisibleItems = !!widget.$dropdownItemsList.children().length;

		if (widget.options.isFiltered) {
			hasVisibleItems = !!widget.$dropdownItemsList.find('> :visible').length;
		}

		widget.$dropdownItemsList.parent()
			.toggleClass('has-visible-items', hasVisibleItems)
			.toggleClass('no-visible-items', !hasVisibleItems)
		;
	},

	/**
	 * Form for localized tab title
	 * @private
	 */
	_initNewItemForm: function() {

		var widget = this;
		var options = this.options;
		var responseCallbacks = this.options.responseCallbacks;
		var keycodes = this.keycodes;
		var urls = this.options.urls;

		var $newItemInputs = widget.$newItemFormGroup.find('input');
		var $newItemAddButton = widget.$newItemFormGroup.find('.btn-add');

		var isMultipleInputs = $newItemInputs.length > 1;
		var isMultipleLocales = $newItemInputs.is('[lang]');

		widget.$newItemFormGroup
			.toggleClass('multiple-inputs', isMultipleInputs)
			.toggleClass('single-input', !isMultipleInputs)
			.toggleClass('multiple-locales', isMultipleLocales)
			.toggleClass('single-locale', !isMultipleLocales)
		;
		/**
		 * Select last list item when pressing Up key
		 */
		$newItemInputs.first().on('keydown', function newItemInputKeydownHandler(event) {

			if (event.which === widget.keycodes.up) {

				widget.$dropdownItemsList.children().last()
					.find(widget.selectors.listItemText + ':visible')
					.focus()
				;
			}
		});

		$newItemInputs.on('keypress', function(event) {

			if (event.which === keycodes.enter) {
				event.preventDefault();
				widget.$newItemFormGroup.find('.btn-add').click();
			}
		});

		$newItemAddButton.on('click', function(event) {

			event.preventDefault();

			var $button = $(this);
			var $newItemInputs = widget.$newItemFormGroup.find('input');
			var isMultipleLocales = $newItemInputs.is('[lang]');
			var data = isMultipleLocales ? {} : null;

			$newItemInputs.each(function newItemInputIterator() {

				var $input = $(this);
				var lang = $input.attr('lang');

				if (isMultipleLocales) {
					data[lang] = $input.val().trim();
				} else {
					data = $input.val().trim();
				}
			});

			// Prevent sending request if nothing is entered
			if (!_.values(data).join('')) {
				return;
			}

			// Prevent creating item with same title
			if (!isMultipleLocales && widget._hasItemWithName(data)) {
				widget._selectItemWithName(data);
				return;
			}

			$button.addClass('disabled');
			widget.$inputSearchEraseButton.hide();
			widget.$loader.show();

			var requestPayload = _.assign(
				{},
				options.ajaxRequestPayload,
				options.ajaxCreateRequestPayload
			);

			requestPayload[options.ajaxCreateRequestDataKey] = data;

			$
				.ajax({
					type: 'POST',
					url: urls.ajaxCreate,
					data: requestPayload,
					dataType: 'json', // for response
				})
				.then(function ajaxCreateSuccess(response) {

					if (response.success) {

						var promise = widget.reinitList();
						widget.$container.trigger("dropdown.create", [{title: response.name, id: response.id}]);

						widget.$input.val(response.name);
						widget._setActiveId(response.id);

						responseCallbacks.createSuccess(widget, promise, response);
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
