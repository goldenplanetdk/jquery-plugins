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
 * @namespace gp.obbDropdownInput
 *
 * @example HTML
 *    <div
 *         class="gp-dropdown-input dropdown-input-for-something"
 *         data-add="{{ path('BESomethingNewAjax') }}"
 *         data-delete="{{ path('BESomethingDeleteAjax') }}"
 *         data-search="{{ path('BESomethingSearchAjax') }}"
 *         data-edit="{{ path('BESomething') }}"
 *    >
 *        <label>{{ _('Title') }}:</label>
 *
 *        <span class="add-button-label-slot">{{ _('Add') }}</span>
 *
 *        <div class="new-item-input-slot">
 *            <div class="locale" lang="da">
 *                <i class="be-flag-dk"></i>
 *                <input type="text" name="item[da]" lang="da" placeholder="New item">
 *            </div>
 *            <div class="locale" lang="en">
 *                <i class="be-flag-en"></i>
 *                <input type="text" name="item[en]" lang="en" placeholder="New item">
 *            </div>
 *        </div>
 *
 *        <input type="hidden" value="1" name="item" required="required">
 *   </div>
 *
 * @example JS
 *    $('.dropdown-input-for-something').obbDropdownInput({
 *			ajaxUrls: {
 *				addItem: {{ path('BEItemAdd') }}
 *				deleteItem: {{ path('BEItemDelete') }}
 *				editItem: {{ path('BEItemEdit') }}
 *				searchItem: {{ path('BEItemSearch') }}
 *			},
 * 	  );
 */
$.widget('gp.obbDropdownInput', {

	options: {
		ajaxUrls: {
			addItem: null,
			deleteItem: null,
			editItem: null,
			searchItem: null,
		},
		addItemPayloadDataKey: 'newItem',
		deleteRequestPayload: {},
		responseCallbacks: {
			addSuccess: _.noop,
			deleteSuccess: _.noop,
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
		var $container = this.element;

		options.ajaxUrls.addItem = options.ajaxUrls.addItem || $container.data('add');
		options.ajaxUrls.deleteItem = options.ajaxUrls.deleteItem || $container.data('delete');
		options.ajaxUrls.editItem = options.ajaxUrls.editItem || $container.data('edit');
		options.ajaxUrls.searchItem = options.ajaxUrls.searchItem || $container.data('search');

		var $dropdown = $(
			'<span class="dropdown">'
			+ '	<a href="#" class="dropdown-toggle" data-toggle="dropdown">'
			+ '		<input type="text" class="dropdown-toggle-input" autocomplete="off">'
			+ '		<i class="glyphicon glyphicon-search"></i>'
			+ '	</a>'
			+ '	<ul class="dropdown-menu">'
			+ '		<li>'
			+ '			<ul class="items-list"></ul>'
			+ '		</li>'
			+ '		<li role="separator" class="divider"></li>'
			+ '		<li class="new-item-form-group">'
			+ '   		<button type="button" class="btn btn-primary btn-add"></button>'
			+ '		</li>'
			+ '	</ul>'
			+ '</span>'
		);

		var $label = $container.find('> label:first-child');
		var $loader = $('<div class="ajax-loading-bar" style="display: none;">');
		var $addButtonLabelSlot = $container.find('.add-button-label-slot');
		var $newItemInputSlot = $container.find('.new-item-input-slot');
		var $newItemInput = $newItemInputSlot.find('input[type="text"]');
		var isMultipleInputs = $newItemInput.length > 1;

		var $dropdownItemsList = $dropdown.find('.items-list');
		var $dropdownToggle = $dropdown.find('.dropdown-toggle');
		var $dropdownToggleInput = $dropdown.find('.dropdown-toggle-input');
		var $newItemFormGroup = $dropdown.find('.new-item-form-group');
		var $newItemAddButton = $newItemFormGroup.find('.btn-add');

		$container
			.append($dropdown)
			.append($loader)
		;

		$label.on('click', function() {
			$dropdownToggleInput.trigger('focus');
		});

		$newItemFormGroup
			.prepend($newItemInputSlot)
			.toggleClass('multiple-inputs', isMultipleInputs)
			.toggleClass('single-input', !isMultipleInputs)
		;

		$newItemAddButton.html($addButtonLabelSlot.html() || 'Add');

		$newItemInput.toggleClass('form-control', !isMultipleInputs);

		_.assign(widget, {
			$container: $container,
			$dropdown: $dropdown,
			$dropdownItemsList: $dropdownItemsList,
			$dropdownToggle: $dropdownToggle,
			$dropdownMenu: $dropdown.find('.dropdown-menu'),
			$input: $dropdownToggle.find('input'),
			$inputSearchEraseButton: $dropdownToggle.find('i'),
			$newTitleForm: $dropdown.find('.new-item-form-group'),
			$newTitleFormDivider: $dropdown.find('.divider'),
			$loader: $container.find('.ajax-loading-bar'),
			$hiddenInput: $container.find('input[type="hidden"]'),
		});

		widget._initList();
		widget._initInput();
		widget._buildNewTitleForm();
	},

	/**
	 * Fetch tab titles from server or return existing
	 * @returns {Promise}
	 */
	getListItemsPromise: function() {

		var widget = this;
		var ajaxUrls = this.options.ajaxUrls;

		if (widget.listItems.length) {

			return new Promise(function(resolve) {
				resolve(widget.listItems);
			});
		}
		else {
			return $
				.getJSON(
					ajaxUrls.searchItem,
					{q: '*'},
					function(data) {
						return widget.listItems = data;
					}
				)
				.promise();
		}
	},

	/**
	 * Reinitialize titles in dropdown
	 * @param {Promise} [listItemsPromise]
	 * @return {Promise}
	 */
	reinitList: function(listItemsPromise) {

		var widget = this;

		widget.listItems = [];
		widget.$dropdown.find(widget.selectors.listItem).remove();

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

		listItemsPromise = listItemsPromise || widget.getListItemsPromise();

		listItemsPromise.then(function(listItems) {

			var options = widget.options;
			var ajaxUrls = widget.options.ajaxUrls;
			var callbacks = widget.options.responseCallbacks;
			var keycodes = widget.keycodes;
			var selectors = widget.selectors;

			var listItemClass = _.trimStart(selectors.listItem, '.');
			var listItemTextClass = _.trimStart(selectors.listItemText, '.');
			var listItemDeleteClass = _.trimStart(selectors.listItemDelete, '.');
			var listItemEditClass = _.trimStart(selectors.listItemEdit, '.');
			var $listItems = $();

			// Add list item for each title
			listItems.forEach(function(tabTitle) {

				$listItems = $listItems.add(
					'<li class="' + listItemClass + '" data-id="' + tabTitle.id + '">'
					+ '	<a href="#" class="' + listItemTextClass + '">'
					+ '		' + tabTitle.name
					+ '	</a>'
					+ '	<a class="' + listItemEditClass + '" title="Edit"'
					+ ' 	href="' + ajaxUrls.editItem + tabTitle.id + '/"'
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

			widget.$dropdownItemsList.prepend($listItems);

			var $deleteButtons = $listItems.find(selectors.listItemDelete);

			widget._applyActiveItem();

			// Select title from dropdown
			$listItems.on('click', function listItemClickHandler(event) {

				const $link = $(event.target).closest('a');
				const linkHref = $link.attr('href');

				// Prevent page scroll
				if (!linkHref || linkHref === '#') {
					event.preventDefault();
				}

				widget._selectListItem($(this));
				widget.$input.focus();
				widget._hideDropdown();
			});

			// Delete title from dropdown
			$deleteButtons.on('click', function deleteItemClickHandler() {

				var $delete = $(this);

				bootbox.confirm(textSureToDelete, function(okDelete) {

					if (!okDelete) {
						return;
					}

					var $listItem = $delete.closest('li');
					var id = $listItem.data('id');

					var requestPayload = _.assign(
						{id: id},
						options.deleteRequestPayload
					);

					widget.$loader.show();

					$.post(
						options.ajaxUrls.deleteItem,
						requestPayload,
						function ajaxDeleteSuccess(response) {

							widget.$loader.hide();

							if (response.success) {

								var promise = widget.reinitList();

								widget._clearInput();

								callbacks.deleteSuccess(widget, promise);
							} else {
								bootbox.alert(response.message);
							}
						}
					);
				});
			});
		});

		return listItemsPromise;
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

				widget._filterList();

				// Let dropdown open and then refocus the input field
				setTimeout(function() {
					widget.$input.focus();
				}, 0);
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
					widget._hideDropdown({restoreFormerValue: true});
					return;
				}

				var selectors = widget.selectors;
				var title = widget.$input.val();

				widget._showDropdown();
				widget._filterList();
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
			}

			// No need to open dropdown as this button is marked as dropdown-toggle button
			setTimeout(function() { widget.$input.focus(); });
		});
	}
	,

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
			widget.formerId = widget._getActiveId();

			// Timeout is required because the Bootstrap dropdown plugin
			// sets the focus on a dropdown item within curing call stack
			setTimeout(function() { widget.$input.focus(); });
		}
	}
	,

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
	}
	,

	/**
	 * Clear input field
	 * @private
	 */
	_clearInput: function() {

		var widget = this;

		widget._setActiveId(null);
		widget._applyActiveItem();
	}
	,

	/**
	 * Check whether dropdown is open
	 * @private
	 * @return {boolean}
	 */
	_isDropdownOpen: function() {
		return this.$dropdown.is('.open');
	}
	,

	/**
	 * Get active value's id
	 * @private
	 * @returns {number}
	 */
	_getActiveId: function() {
		return Number(this.$hiddenInput.val());
	}
	,

	/**
	 * Set id of active value
	 * @private
	 * @param {number|null} [activeId] Will be removed if empty
	 */
	_setActiveId: function(activeId) {
		this.$hiddenInput.val(_.isNil(activeId) ? '' : activeId);
	}
	,

	/**
	 * Get list item that is marked as active
	 * @private
	 * @returns {jQuery} Active list item
	 */
	_getActiveListItem: function() {

		var widget = this;

		var listItemSelector = widget.selectors.listItem;
		var $listItems = widget.$container.find(listItemSelector);

		var $activeListItem = $listItems.filter(function() {
			return $(this).is('.active');
		});

		return $activeListItem;
	}
	,

	/**
	 * Add active class to active list item
	 * @private
	 */
	_markActiveListItem: function() {

		var widget = this;

		var activeId = widget._getActiveId();
		var listItemSelector = widget.selectors.listItem;
		var $listItems = widget.$container.find(listItemSelector);

		$listItems.each(function() {

			var $listItem = $(this);
			var listItemId = Number($listItem.data('id'));

			$listItem.toggleClass('active', listItemId === activeId);
		});
	}
	,

	/**
	 * Update widget according to the values of active item
	 * @private
	 */
	_applyActiveItem: function() {

		var widget = this;

		// Update the input field with active item title
		widget._updateInputValue();

		// Toggles search/erase icon
		widget._toggleSearchIcon();

		// Mark selected list item with `active` class
		widget._markActiveListItem();
	}
	,

	/**
	 * Update input field with current title (from hidden input)
	 * @private
	 */
	_updateInputValue: function() {

		var widget = this;

		var activeId = widget._getActiveId();
		var currentTitle = '';

		widget.listItems.forEach(function(tabTitle) {

			if (tabTitle.id === activeId) {
				currentTitle = tabTitle.name;
			}
		});

		widget.$input.val(currentTitle);
	}
	,

	/**
	 * Toggle list items and new title form visibility in the dropdown
	 * according to the query string in the title input
	 *
	 * @private
	 */
	_filterList: function() {

		var widget = this;
		var query = widget.$input.val();
		var $matchedEls = widget._matchInputActiveTitle(query);

		// Show only items that matches query from the input field
		widget._hideTitleEls();
		$matchedEls.show();

		var $active = widget._getActiveListItem();

		// Hide the New title form when there is a title with exact match
		widget.$newTitleForm.toggle(!$active.length);
		widget.$newTitleFormDivider.toggle(!$active.length);

		// Hide divider when there are no matching titles
		if (!$matchedEls.length) {
			widget.$newTitleFormDivider.hide();
		}

		widget._markActiveListItem();
		widget._toggleSearchIcon();
	}
	,

	/**
	 * Hide the list of tab titles
	 *
	 * @private
	 */
	_hideTitleEls: function() {
		this.$container.find(this.selectors.listItem).hide();
	}
	,

	/**
	 * Actions on item activation
	 * @private
	 * @param {jQuery} $selectedListItem
	 */
	_selectListItem: function($selectedListItem) {

		var widget = this;

		// Set active id to the hidden input field
		widget._setActiveId($selectedListItem.data('id'));

		widget._applyActiveItem();
	}
	,

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
	}
	,

	/**
	 * Find matching tab titles in list (case-insensitive)
	 * set active id and mark list item with active class
	 *
	 * @private
	 * @param {string} term
	 * @returns {jQuery}
	 */
	_matchInputActiveTitle: function(term) {

		var widget = this;
		var selectors = this.selectors;

		var $listItems = widget.$container.find(selectors.listItem);
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
	}
	,

	/**
	 * Form for localized tab title
	 * @private
	 */
	_buildNewTitleForm: function() {

		var widget = this;
		var options = this.options;
		var callbacks = this.options.responseCallbacks;
		var keycodes = this.keycodes;
		var ajaxUrls = this.options.ajaxUrls;

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
			widget.$loader.show();

			var requestPayload = {};

			requestPayload[options.addItemPayloadDataKey] = data;

			$.post(
				ajaxUrls.addItem,
				requestPayload,
				function(response) {

					$button.removeClass('disabled');
					widget.$loader.hide();

					if (response.success) {

						var promise = widget.reinitList();

						widget.$input.val(response.name);
						widget._setActiveId(response.id);

						callbacks.addSuccess(widget, promise);
					}
					else {
						bootbox.alert(response.message);
					}
				},
				'json'
			);
		});
	}
	,

	/**
	 * Widget-specific cleanup
	 * @private
	 */
	_destroy: function() {
		this.$container.find(selectors.listItem).remove();
	}
});
