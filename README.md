# DataTables Advanced Search

Advanced Search extension for DataTables instant search feature.

This extension allows the user to search within a column with multiple features such as include, exclude, less, greater, and others.

## Features

* Include only
* Exclude only
* Greater than (numeric)
* Greater or equal than (numeric)
* Less than (numeric)
* Less or equal than (numeric)
* Equal than (numeric)
* Multiple search with commas
* Quotes support

## How to use

```
var table = $('#datatable-users').DataTable(
	{
		columns:
		[
			{ title: "ID", data: "id" },
			{ title: "Username", data: "username", name: "username"},
			{ title: "Name", data: "name", name: "name" },
			{ title: "Age", data: "age", name: "age" },
			{ title: "Email", data: "email", name: "email" }
		],
		ajax: {
			"url": "data.txt",
			"type": "GET"
		},
		"searching": true,
		"AdvancedSearch": {
			stringColumns: ['username', 'name', 'email'],
			aritmeticColumns: ['age'],
			sensitive: false,
			enable: true
		}
	});
```

### Set the columns to add Advanced Search extension

```
table.AdvancedSearch().stringColumns(["name"]);
```

Also accepts no input and will return the columns currently enabled.

### Set the columns to add Advanced Search extension (Aritmetic features)

```
table.AdvancedSearch().aritmeticColumns(["age"]);
```

Also accepts no input and will return the columns currently enabled.

### Enable the extension

```
table.AdvancedSearch().enable();
```

### Disable the extension

```
table.AdvancedSearch().disable();
```

### Set the case sensitive for Advanced Search extension

```
table.AdvancedSearch().sensitive(true);
```

### Check the settings

```
table.AdvancedSearch().getStatus();
```

## How to search with this extension (Examples)

Searching only in `name` column:
```
name:"John Cena"
```

Search for all entries except all that have `John` in the `name`:
```
-name:John
```

Search for multiple entries:
```
name:"John Cena",April
```

Aritmetic search:
```
age>=18
```

## Required libraries

* [Jquery](https://jquery.com/)
* [DataTables](https://datatables.net/)

# Donate

If you like my work and want to contribute by donating money, check my [Donation page](http://anjo2.com/donate/)

# License
Copyright (c) 2018 Cláudio Patrício

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
