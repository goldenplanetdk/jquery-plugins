# GoldenPlanet CRUD Bootstrap Dropdown with Inputs jQuery UI widget

a.k.a. **GP CRUD Dropdown**

## Demo

Run a simple web server that will serve the `demo.html`


## API

Content that should be a part of a nested markup is specified in the so called slots (transcluded content in terms of Angular).
Namely:

- `<dropdown-toggle slot>` Replace content in the dropdown toggle
- `<new-item-input slot>` Single or multiple (multilingual) input fields for New item title
- `<add-button-label slot>` Label for the **Add** new item button

Contents of the dropdown menu toggle button and the New item form elements 

The `edit`, `search`, `add`, `delete` urls can be specified as data attributes or in widget options.
The latter have higher priority. Full list of options:

```
$('.crud-foobar').crudDropdownInput({

	urls: {
		edit: '/foobar/',
		ajaxCreate: '/foobar/add',
		ajaxDelete: '/foobar/delete',
		ajaxSearch: '/foobar/search',
		ajaxSelect: '/foobar/select', // optional
	},
	
    // Key name for the data in ajaxCreate request payload
    // The request will contain `{newItem: 'Title'}`
	ajaxCreateRequestDataKey: 'newItem',
	
    // Additional data that will be added to the request payload
    // that by default will contain only the item's id, e.g. `{id: 5}`
	ajaxSelectRequestPayload: {},
	ajaxDeleteRequestPayload: {},
	
	// Invoked when the widget is created for the first time
	createCallback: function(widget),
	// Invoked when the widget is initialized/reinitialized
	initCallback: function(widget),
	
	// For every callback the widget instance 
	// and an AJAX promise (with requested/resolved List Items) is provided
	responseCallbacks: {
		addSuccess: function(widget, promise) {},
		deleteSuccess: function(widget, promise) {},
		searchSuccess: function(widget) {},
	},
	
	// Translations for Add button label and dialog text
	translations: {
		add: 'Add',
		confirmDelete: 'Are you sure to delete it?',
	},
});
```

Public methods for widget instance are available and can be invoked in one of two ways:

```
$('.crud-foobar').crudDropdownInput('publicMethod');
```

```
$('.crud-foobar').data('gp-crudDropdownInput').publicMethod();
```

See HTML markup example in `gp-jqui-crud-dropdown-input.js`

To make the dropdown appear as `inline-block` (e.g. for Wishlist button) add the `inline` class to the root element


## Public properties

#### `{Object}` options

Actual widget options

#### `{Array}` listItems

Array of items that are used to build the list in the dropdown menu


## Public methods

#### getListItemsAjaxPromise()

Fetch tab titles from server or return existing from `listItems` property

To force fetching fresh titles the array in `listItems` should be emptied first

#### reinitList()

Remove all list items and fetch fresh data from the server.

Empties the `listItems` property and removes list item elements from the dropdown menu

#### getActiveId()

Active item's id. Gathered from the hidden input

#### getActiveText()

Active item's text. Gathered from active list item's text

## Dependencies

See `dependencies` section in `package.json`