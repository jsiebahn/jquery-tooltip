jQuery.tooltip
==============

A jQuery plugin to create styled tooltips with less coding.

Visit [jQuery.findX on Github](https://github.com/jsiebahn/jquery-tooltip) for sources and examples.


Start with jQuery tooltip
-------------------------

jQuery tooltip will convert any title attribute to a html tooltip. Also html markup may be used as
tooltip by setting css selectors from the tooltipped element to the markup.

To activate jQuery tooltip call ```jQuery.tooltip.on()``` when dom is ready.

For more examples see
[example.html](https://github.com/jsiebahn/jquery-tooltip/example/example.html) and for
documentation of options take a look at the ```defaults``` object in
[jquery.tooltip.js](https://github.com/jsiebahn/jquery-tooltip/src/jquery.tooltip.js)


API
---

jQuery tooltip offers a few simple methods to enable and disable the tooltips and for configuration.

Global methods:

* ```$.tooltip([options])``` extends the settings with the given options.
* ```$.tooltip.on([options])``` enables the tooltips and extends the settings with the optional
  given options.
* ```$.tooltip.off([options])``` disables the tooltips and extends the settings with the optional
  given options.

Methods for elements:

* ```$('selector').tooltip([options])``` delegates to ```$.tooltip([options])```.
* ```$.tooltipOn()``` enables the tooltips for the set of selected elements.
* ```$.tooltipOff()``` disables the tooltips for the set of selected elements.


jQuery.findX
------------

jQuery.tooltip will use [jQuery.findX](https://github.com/jsiebahn/jquery-findx) to find the markup
for the tooltip relative to the tooltipped element. If jQuery.findX is not available, absolute
selectors from the document are used with the default ```jQuery('selector')```.


License
-------

jQuery.tooltip is released under the terms of the [MIT License](MIT-LICENSE).


Authors
-------

[Jörg Siebahn](https://github.com/jsiebahn)