// Copyright (c) 2018 Cláudio Patrício
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * @summary     AdvancedSearch
 * @description Advanced Search extension for DataTables
 * @version     1.0.0
 * @file        dataTables.advancedSearch.js
 * @author      claudiopatricio <cpatricio@ua.pt>
 * @contact     github.com/claudiopatricio/DataTables-AdvancedSearch
 * @copyright   MIT Licence
 */

(function(factory)
{
	if(typeof define === 'function' && define.amd)
	{
		define(['jquery', 'datatables.net'], function($)
		{
			return factory($, window, document);
		});
	}
	else if(typeof exports === 'object')
	{
		modules.exports = function(root, $)
		{
			if(!root)
			{
				root = window;
			}
			if(!$ || !$.fn.dataTable)
			{
				$ = require('datatables.net')(root, $).$;
			}
			
			return factory($, root, root.document);
		};
	}
	else
	{
		factory(jQuery, window, document);
	}
}(function($, window, document)
{
	'use strict';
	var DataTable = $.fn.dataTable;
	
	var AdvancedSearch = function(dt, opts)
	{
		if(!(this instanceof AdvancedSearch))
		{
			alert("AdvancedSearch warning: AdvancedSearch must be initialized with the 'new' keyword.");
			return;
		}
		
		if(!DataTable.versionCheck || !DataTable.versionCheck('1.10.8'))
		{
			throw 'AdvancedSearch requires DataTables 1.10.8 or newer';
		}
		
		if(opts === undefined || opts === true)
		{
			opts = {};
		}
		
		var dtSettings = new $.fn.dataTable.Api(dt).settings()[0];
		
		this.s = {
			dt: dtSettings
		};
		
		if(dtSettings.AdvancedSearch)
		{
			throw 'AdvancedSearch already initialised on this table';
		}
		
		dtSettings.advancedSearch = this;
		
		this._constructor(opts);
	};
	$.extend(AdvancedSearch.prototype,
	{
		/**
		 * Get/Set the string columns where AdvancedSearch is enabled
		 * @param {Array} val                
		 * @returns {Array} stringColumns
		 */
		stringColumns: function(val)
		{
			if(val !== undefined && Array.isArray(val))
			{
				this.s.stringColumns = val;
			}
			return $(this.s.stringColumns);
		},
		
		/**
		 * Get/Set the aritmetic columns where AdvancedSearch is enabled
		 * @param {Array} val                
		 * @returns {Array} stringColumns
		 */
		aritmeticColumns: function(val)
		{
			if(val !== undefined && Array.isArray(val))
			{
				this.s.aritmeticColumns = val;
			}
			return $(this.s.aritmeticColumns);
		},
		
		/**
		 * Get/Set the sensitive feature
		 * @param {Array} val                
		 * @returns {Array} stringColumns
		 */
		sensitive: function(val)
		{
			if(val !== undefined && typeof val === typeof true)
			{
				this.s.sensitive = val;
			}
			return $(this.s.sensitive);
		},
		
		/**
		 * Enables AdvancedSearch
		 * @returns {void}
		 */
		enable: function()
		{
			this.s.enable = true;
		},
		
		/**
		 * Disables AdvancedSearch
		 * @returns {void}
		 */
		disable: function()
		{
			this.s.enable = false;
		},
		
		/*
		 * Returns the status of the AdvancedSearch including user changeable variables
		 * @returns {Object}
		 */
		getStatus: function()
		{
			let aux = {
				enable: this.s.enable,
				sensitive: this.s.sensitive,
				stringColumns: this.s.stringColumns,
				aritmeticColumns: this.s.aritmeticColumns
			};
			return aux;
		},
		
		/**
		 * Constructor
		 * @param {Object} oInit   User arguments
		 */
		_constructor: function(oInit)
		{
			this.s = $.extend(true, this.s, AdvancedSearch.defaults, oInit);
			var settings = this.s.dt;
			
			var enable = this.s.enable;
			var dataTable = $(settings.nTable).dataTable().api();
			
			var stringColumns = $(this.s.stringColumns);
			this.stringIndexes = [];
			for(var i = 0, len = stringColumns.length; i < len; i++)
			{
				this.stringIndexes[stringColumns[i]] = dataTable.column(stringColumns[i] + ':name').index();
			}
			
			var aritmeticColumns = $(this.s.aritmeticColumns);
			this.aritmeticIndexes = [];
			for(var i = 0, len = aritmeticColumns.length; i < len; i++)
			{
				this.aritmeticIndexes[aritmeticColumns[i]] = dataTable.column(aritmeticColumns[i] + ':name').index();
			}
			this.getStatus();
			this.search = 
			{
				'Include': {},
				'Exclude': {},
				'Plus': {},
				'PlusOrEqual': {},
				'Less': {},
				'LessOrEqual': {},
				'Equal': {}
			};
			var search = this.search;
			
			// Helper function to parse values for Include and Exclude features
			function parseValues(str)
			{
				let ret = { str: str, values: [] };
				
				if(str[0] == ' ') ret.values.push(''); // Search for empty strings
				else
				{
					let regex_quotes = new RegExp('^"([^"]*)"');
					let regex_til = new RegExp("^'([^']*)'");
					let regex_comma = new RegExp("^([^,]+)[,]");
					let regex_space = new RegExp("^([^ ]+)");
					while(true)
					{
						let aux_quotes = regex_quotes.exec(str);
						if(aux_quotes !== null)
						{
							ret.values.push(aux_quotes[1]);
							str = str.replace(regex_quotes, "");
							if(str[0] == ',')
							{
								str = str.replace(',', '');
								continue;
							}
							else break;
						}
						let aux_til = regex_til.exec(str);
						if(aux_til !== null)
						{
							ret.values.push(aux_til[1]);
							str = str.replace(regex_til, "");
							if(str[0] == ',')
							{
								str = str.replace(',', '');
								continue;
							}
							else break;
						}
						let aux_comma = regex_comma.exec(str);
						if(aux_comma !== null)
						{
							ret.values.push(aux_comma[1]);
							str = str.replace(regex_comma, "");
							continue;
						}
						let aux_space = regex_space.exec(str);
						if(aux_space !== null)
						{
							ret.values.push(aux_space[1]);
							str = str.replace(regex_space, "");
							break;
						}
						break;
					}
				}
				ret.str = str.replace(RegExp("^([ ]+)"), ""); // Remove spaces after search
				return ret;
			}
			
			// Occurs everytime input is changes and overrides default action of dataTables search feature
			$('.dataTables_filter input')
				.unbind() // Unbind previous default bindings
				.bind('input', function(e)
				{
					var searchInput = $(this).val();
					if(enable)
					{
						// Search for Include and Exclude features
						for(var i = 0, len = stringColumns.length; i < len; i++)
						{
							var arr_Include = [];
							var arr_Exclude = [];
							while(true) //
							{
								var reg_Include = new RegExp(stringColumns[i] + ":.+").exec(searchInput); // Not Empty
								var reg_Exclude = new RegExp("[-]" + stringColumns[i] + ":.+", "").exec(searchInput); // Not Empty
								if(reg_Exclude !== null)
								{
									let header = "-" + stringColumns[i] + ":"; // Header string to remove
									let start = searchInput.indexOf(header); // Location of Header
									let aux = parseValues(searchInput.substring(start + header.length)); // Parse only after Header
									
									searchInput = searchInput.substring(0, start) + aux.str; // New search if start until Header plus the not parsed values
									
									if(aux.values.length == 1) arr_Exclude.push(aux.values[0]);
									else if(aux.values.length > 1) arr_Exclude.push(aux.values);
								}
								else if(reg_Include !== null)
								{
									let header = stringColumns[i] + ":"; // Header string to remove
									let start = searchInput.indexOf(header); // Location of Header
									let aux = parseValues(searchInput.substring(start + header.length)); // Parse only after Header
									
									searchInput = searchInput.substring(0, start) + aux.str; // New search if start until Header plus the not parsed values
									
									if(aux.values.length == 1) arr_Include.push(aux.values[0]);
									else if(aux.values.length > 1) arr_Include.push(aux.values);
								}
								else
								{
									break;
								}
							}
							search.Include[stringColumns[i]] = arr_Include;
							search.Exclude[stringColumns[i]] = arr_Exclude;
						}
						
						// Search for Plus, PlusOrEqual, Less and LessOrEqual features
						for(var i = 0, len = aritmeticColumns.length; i < len; i++)
						{
							var arr_Plus = [];
							var arr_PlusOrEqual = [];
							var arr_Less = [];
							var arr_LessOrEqual = [];
							var arr_Equal = [];
							while(true) //
							{
								var reg_Plus = new RegExp(aritmeticColumns[i] + "\>([^ ]+)", "").exec(searchInput);
								var reg_PlusOrEqual = new RegExp(aritmeticColumns[i] + "\>\=([^ ]+)", "").exec(searchInput);
								var reg_Less = new RegExp(aritmeticColumns[i] + "\<([^ ]+)", "").exec(searchInput);
								var reg_LessOrEqual = new RegExp(aritmeticColumns[i] + "\<\=([^ ]+)", "").exec(searchInput);
								var reg_Equal = new RegExp(aritmeticColumns[i] + "\=([^ ]+)", "").exec(searchInput);
								if(reg_PlusOrEqual !== null)
								{
									arr_PlusOrEqual.push(reg_PlusOrEqual[1]);
									searchInput = searchInput.replace(new RegExp(aritmeticColumns[i] + "\>\=([^ ]+)[ ]*", ""), "");
								}
								else if(reg_Plus !== null)
								{
									arr_Plus.push(reg_Plus[1]);
									searchInput = searchInput.replace(new RegExp(aritmeticColumns[i] + "\>([^ ]+)[ ]*", ""), "");
								}
								else if(reg_LessOrEqual !== null)
								{
									arr_LessOrEqual.push(reg_LessOrEqual[1]);
									searchInput = searchInput.replace(new RegExp(aritmeticColumns[i] + "\<\=([^ ]+)[ ]*", ""), "");
								}
								else if(reg_Less !== null)
								{
									arr_Less.push(reg_Less[1]);
									searchInput = searchInput.replace(new RegExp(aritmeticColumns[i] + "\<([^ ]+)[ ]*", ""), "");
								}
								else if(reg_Equal !== null)
								{
									arr_Equal.push(reg_Equal[1]);
									searchInput = searchInput.replace(new RegExp(aritmeticColumns[i] + "\=([^ ]+)[ ]*", ""), "");
								}
								else
								{
									break;
								}
							}
							search.Plus[aritmeticColumns[i]] = arr_Plus;
							search.PlusOrEqual[aritmeticColumns[i]] = arr_PlusOrEqual;
							search.Less[aritmeticColumns[i]] = arr_Less;
							search.LessOrEqual[aritmeticColumns[i]] = arr_LessOrEqual;
							search.Equal[aritmeticColumns[i]] = arr_Equal;
						}
					}
					dataTable.search(searchInput).draw();
				});
		}
	});
	
	AdvancedSearch.version = '1.0.0';
	AdvancedSearch.defaults = {
		/**
		 * Case-sensitive search
		 * @type {Boolean}
		 */
		sensitive: false,
		
		/**
		 * Enable/Disable AdvancedSearch
		 * @type {Boolean}
		 */
		enable: true,
		
		/**
		 * Columns to enable the Include/Exclude features
		 * @type {Array}
		 */
		stringColumns: [],
		
		/**
		 * Columns to enable the Plus/PlusOrEqual/Less/LessOrEqual features
		 * @type {Array}
		 */
		aritmeticColumns: []
	};
	
	// Expose
	$.fn.dataTable.AdvancedSearch = AdvancedSearch;
	$.fn.DataTable.AdvancedSearch = AdvancedSearch;
	
	/* -------------------- API Functions START -------------------- */
	DataTable.Api.register('AdvancedSearch()', function()
	{
		return this;
	});
	
	DataTable.Api.register('AdvancedSearch().stringColumns()', function(val)
	{
		var ctx = this.context;
		if(ctx.length && ctx[0].advancedSearch)
		{
			return ctx[0].advancedSearch.stringColumns(val);
		}
	});
	
	DataTable.Api.register('AdvancedSearch().aritmeticColumns()', function(val)
	{
		var ctx = this.context;
		if(ctx.length && ctx[0].advancedSearch)
		{
			return ctx[0].advancedSearch.aritmeticColumns(val);
		}
	});
	
	DataTable.Api.register('AdvancedSearch().enable()', function()
	{
		var ctx = this.context;
		if(ctx.length && ctx[0].advancedSearch)
		{
			ctx[0].advancedSearch.enable();
		}
	});
	
	DataTable.Api.register('AdvancedSearch().disable()', function()
	{
		var ctx = this.context;
		if(ctx.length && ctx[0].advancedSearch)
		{
			ctx[0].advancedSearch.disable();
		}
	});
	
	DataTable.Api.register('AdvancedSearch().getStatus()', function()
	{
		var ctx = this.context;
		if(ctx.length && ctx[0].advancedSearch)
		{
			return ctx[0].advancedSearch.getStatus();
		}
	});
	
	DataTable.Api.register('AdvancedSearch().sensitive()', function(val)
	{
		var ctx = this.context;
		if(ctx.length && ctx[0].advancedSearch)
		{
			return ctx[0].advancedSearch.sensitive(val);
		}
	});
	
	/* -------------------- API Functions END -------------------- */
	
	// Init of AdvancedSearch
	$(document).on('preInit.dt.dtAdvancedSearch', function(e, settings)
	{
		if(e.namespace !== 'dt')
		{
			return;
		}
		
		var init = settings.oInit.AdvancedSearch;
		var defaults = DataTable.defaults.AdvancedSearch;
		
		if(init || defaults)
		{
			var opts = $.extend({}, init, defaults);
			
			if(init !== false)
			{
				new AdvancedSearch(settings, opts);
			}
		}
	});
	
	// Helper function to check input is numeric (integer or float)
	function isNumeric(n)
	{
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	
	// This is the last step of searching with DataTables
	$.fn.dataTableExt.search.push(function(settings, data, dataIndex)
	{
		var AdvancedSearch_settings = settings.advancedSearch.s;
		if(!AdvancedSearch_settings.enable) return false;
		var AS = settings.advancedSearch;
		
		var stringIndexes = AS.stringIndexes;
		var stringColumns = AdvancedSearch_settings.stringColumns;
		
		var aritmeticIndexes = AS.aritmeticIndexes;
		var aritmeticColumns = AdvancedSearch_settings.aritmeticColumns;
		
		var dataTable = $(settings.nTable).dataTable().api();
		
		for(var i=0, len = stringColumns.length; i < len; i++)
		{
			if(Array.isArray(AS.search.Exclude[stringColumns[i]]))
			{
				for(var n = AS.search.Exclude[stringColumns[i]].length - 1; n >= 0; n--)
				{
					if(AdvancedSearch_settings.sensitive)
					{
						if(Array.isArray(AS.search.Exclude[stringColumns[i]][n]))
						{
							let res = false;
							for(var m = AS.search.Exclude[stringColumns[i]][n].length - 1; m >=0 ; m--)
							{
								if(data[stringIndexes[stringColumns[i]]].indexOf(  AS.search.Exclude[stringColumns[i]][n][m]  ) == -1)
								{
									res = true;
									break;
								}
							}
							if(!res) return false;
						}
						else
						{
							if(data[stringIndexes[stringColumns[i]]].indexOf(  AS.search.Exclude[stringColumns[i]][n]   ) > -1)
							{
								if(!(AS.search.Exclude[stringColumns[i]][n].length === 0 && data[stringIndexes[stringColumns[i]]].length > 0)) return false;
							}
						}
					}
					else
					{
						if(Array.isArray(AS.search.Exclude[stringColumns[i]][n]))
						{
							var res = false;
							for(var m = AS.search.Exclude[stringColumns[i]][n].length - 1; m >=0 ; m--)
							{
								if(data[stringIndexes[stringColumns[i]]].toLowerCase().indexOf(  AS.search.Exclude[stringColumns[i]][n][m].toLowerCase()  ) == -1)
								{
									res = true;
									break;
								}
							}
							if(!res) return false;
						}
						else
						{
							if(data[stringIndexes[stringColumns[i]]].toLowerCase().indexOf(  AS.search.Exclude[stringColumns[i]][n].toLowerCase()   ) > -1)
							{
								if(!(AS.search.Exclude[stringColumns[i]][n].length === 0 && data[stringIndexes[stringColumns[i]]].length > 0)) return false;
							}
						}
					}
				}
			}
			if(Array.isArray(AS.search.Include[stringColumns[i]]))
			{
				for(var n = AS.search.Include[stringColumns[i]].length - 1; n >= 0; n--)
				{
					if(AdvancedSearch_settings.sensitive)
					{
						if(Array.isArray(AS.search.Include[stringColumns[i]][n]))
						{
							let res = false;
							for(var m = AS.search.Include[stringColumns[i]][n].length - 1; m >=0 ; m--)
							{
								if(AS.search.Include[stringColumns[i]][n][m].length === 0) res |= (data[stringIndexes[stringColumns[i]]].length === 0);
								else res |= (data[stringIndexes[stringColumns[i]]].indexOf(  AS.search.Include[stringColumns[i]][n][m]   ) !== -1);
							}
							if(!res) return false;
						}
						else
						{
							if(data[stringIndexes[stringColumns[i]]].indexOf(  AS.search.Include[stringColumns[i]][n]   ) == -1)
							{
								return false;
							}
							else
							{
								if(AS.search.Include[stringColumns[i]][n].length == 0 && data[stringIndexes[stringColumns[i]]].length > 0) return false;
							}
						}
					}
					else
					{
						if(Array.isArray(AS.search.Include[stringColumns[i]][n]))
						{
							let res = false;
							for(var m = AS.search.Include[stringColumns[i]][n].length - 1; m >= 0; m--)
							{
								if(AS.search.Include[stringColumns[i]][n][m].length === 0) res |= (data[stringIndexes[stringColumns[i]]].length === 0);
								else res |= (data[stringIndexes[stringColumns[i]]].toLowerCase().indexOf(  AS.search.Include[stringColumns[i]][n][m].toLowerCase()   ) !== -1);
							}
							if(!res) return false;
						}
						else
						{
							if(data[stringIndexes[stringColumns[i]]].toLowerCase().indexOf(  AS.search.Include[stringColumns[i]][n].toLowerCase()   ) == -1)
							{
								return false;
							}
							else
							{
								if(AS.search.Include[stringColumns[i]][n].length == 0 && data[stringIndexes[stringColumns[i]]].length > 0) return false;
							}
						}
					}
				}
			}
		}
		for(var i=0, len = aritmeticColumns.length; i < len; i++)
		{
			if(Array.isArray(AS.search.PlusOrEqual[aritmeticColumns[i]]))
			{
				
				for(var n = AS.search.PlusOrEqual[aritmeticColumns[i]].length - 1; n >= 0; n--)
				{
					if(!isNumeric(AS.search.PlusOrEqual[aritmeticColumns[i]][n]) || !isNumeric(data[aritmeticIndexes[aritmeticColumns[i]]])) return false;
					if(Number(data[aritmeticIndexes[aritmeticColumns[i]]]) < Number(AS.search.PlusOrEqual[aritmeticColumns[i]][n])) return false;
				}
			}
			if(Array.isArray(AS.search.Plus[aritmeticColumns[i]]))
			{
				for(var n = AS.search.Plus[aritmeticColumns[i]].length - 1; n >= 0; n--)
				{
					if(!isNumeric(AS.search.Plus[aritmeticColumns[i]][n]) || !isNumeric(data[aritmeticIndexes[aritmeticColumns[i]]])) return false;
					if(Number(data[aritmeticIndexes[aritmeticColumns[i]]]) <= Number(AS.search.Plus[aritmeticColumns[i]][n])) return false;
				}
			}
			if(Array.isArray(AS.search.LessOrEqual[aritmeticColumns[i]]))
			{
				for(var n = AS.search.LessOrEqual[aritmeticColumns[i]].length - 1; n >= 0; n--)
				{
					if(!isNumeric(AS.search.LessOrEqual[aritmeticColumns[i]][n]) || !isNumeric(data[aritmeticIndexes[aritmeticColumns[i]]])) return false;
					if(Number(data[aritmeticIndexes[aritmeticColumns[i]]]) > Number(AS.search.LessOrEqual[aritmeticColumns[i]][n])) return false;
				}
			}
			if(Array.isArray(AS.search.Less[aritmeticColumns[i]]))
			{
				for(var n = AS.search.Less[aritmeticColumns[i]].length - 1; n >= 0; n--)
				{
					if(!isNumeric(AS.search.Less[aritmeticColumns[i]][n]) || !isNumeric(data[aritmeticIndexes[aritmeticColumns[i]]])) return false;
					if(Number(data[aritmeticIndexes[aritmeticColumns[i]]]) >= Number(AS.search.Less[aritmeticColumns[i]][n])) return false;
				}
			}
			if(Array.isArray(AS.search.Equal[aritmeticColumns[i]]))
			{
				for(var n = AS.search.Equal[aritmeticColumns[i]].length - 1; n >= 0; n--)
				{
					if(!isNumeric(AS.search.Equal[aritmeticColumns[i]][n]) || !isNumeric(data[aritmeticIndexes[aritmeticColumns[i]]])) return false;
					if(Number(data[aritmeticIndexes[aritmeticColumns[i]]]) != Number(AS.search.Equal[aritmeticColumns[i]][n])) return false;
				}
			}
		}
		return true;
	});
	
	return AdvancedSearch;
}));
