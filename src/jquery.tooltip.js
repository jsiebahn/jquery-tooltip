/** @license jQuery tooltip Plugin v0.1.0 Copyright 2014 J. Siebahn, Released under the MIT license
 *  https://github.com/jsiebahn/jquery-tooltip
 */
/**
 * A jQuery plugin to create styled tooltips with less coding.
 *
 * Requires jQuery.
 * Optionally uses jQuery.findX: https://github.com/jsiebahn/jquery-findx
 *
 * Tested with jQuery 1.11.0
 *
 */
(function($, window) {

    //noinspection JSUnusedLocalSymbols
    /**
     * The default settings.
     *
     * @type {{}}
     */
    var defaults = {

        /**
         * The template used to generate the tooltip html. There will be exactly one element placed
         * into the dom created from this template. It will be shown and hidden on mouse move
         * events and filled with the current tooltip content. Use #templateContentSelector to
         * identify the element of this template where the content will be placed in.
         */
        template: '<div class="tooltip"><div class="tooltipContent"></div></div>',

        /**
         * This selector is executed on the #template and should result in a single element of the
         * template. The content of the tooltip will be placed in this element.
         */
        templateContentSelector: '.tooltipContent',

        /**
         * A single html node where tooltip text content from the title attribute will be placed
         * in before it is used as content for the tooltip template.
         */
        titleAttributeWrapper: '<p></p>',

        /**
         * A callback for the text title. Should escape the title for html and may be used for
         * custom changes like line breaks, emoticons.
         *
         * @param title the title to show next
         * @param element the element the title should be shown for
         * @returns {String} the html escaped title
         */
        titleCallback: function(title, element) {
            return title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        },

        /**
         * Configures the positioning.
         */
        position: {

            /**
             * If no other position is explicitly set at the tooltip element, this position will be
             * used.
             */
            defaultPosition: 'se',

            /**
             * If the tooltip can not be placed using the desired position because it would extend
             * the viewport, the alternate positions for the desired position are checked in the
             * given order. If no position will display the tooltip inside the viewport, the
             * tooltip is not shown.
             */
            alternates: {
                'se' : ['s', 'sw', 'e', 'ne', 'n', 'nw', 'w'],
                'sw' : ['s', 'se', 'w', 'nw', 'n', 'ne', 'e'],
                'ne' : ['n', 'nw', 'e', 'se', 's', 'sw', 'w'],
                'nw' : ['n', 'ne', 'w', 'sw', 's', 'se', 'e'],
                'n' : ['ne', 'nw', 's', 'se', 'sw', 'e', 'w'],
                's' : ['se', 'sw', 'n', 'ne', 'nw', 'e', 'w'],
                'e' : ['se', 'ne', 'w', 'sw', 'nw', 's', 'n'],
                'w' : ['sw', 'nw', 'e', 'se', 'ne', 's', 'n']
            }
        },

        /**
         * Definition of html attributes for tooltip configuration.
         */
        attributes: {
            /**
             * If this attribute is set on tooltip element, the tooltip will not show up.
             * The attribute may be set dynamically using $(myElement).tooltip.off() and removed
             * with $(myElement).tooltip.on(). The global switches $.tooltip.on() and
             * $.tooltip.off() will not affect individually disabled elements.
             */
            'disabled' : 'data-tooltip-disabled',
            /**
             * The default position of a specific tooltipped element. May be one of n, s, w, e, nw,
             * ne, sw, sw to identify the geographic direction of the tooltip relative to it's
             * element. If the position causes the tooltip not to be inside the viewport, the
             * #position.alternates positions are checked to position the tooltip.
             */
            'position' : 'data-tooltip-position',
            /**
             * The attributes containing simple tooltip text. While the tooltip is shown, the
             * attributes will be removed from the element to avoid default browser behaviour.
             */
            'tooltipText' : ['title', 'data-tooltip-title'],
            /**
             * A css selector pointing to a html node used as markup for the tooltip. If
             * jquery.findX is available, the selector is relative to the tooltipped element
             * according to the rules of jQuery.findX with the body as root. See
             * https://github.com/jsiebahn/jquery-findx for details. Otherwise jQuery.find will be
             * used on the html body to find the markup. #tooltipMarkup is preferred against any
             * #tooltipText for finding the tooltip content.
             */
            'tooltipMarkup' : 'data-tooltip',
            /**
             * Optional attribute with additional css classes that should be added to the outer
             * node of the tooltip template while the tooltip is shown.
             */
            tooltipCssClasses : 'data-tooltip-class'
        }

    };

    /**
     * Prefix to temporarily store tooltip text information.
     * @type {string}
     */
    var DATA_STORE_PREFIX = 'tooltip-temp-';

    /**
     * The event where tooltip display is checked.
     * @type {string}
     */
    var EVENT = 'mousemove.tooltip';

    /**
     * The global settings based on the defaults and extended by configuration.
     * @type {*}
     */
    var globalSettings = $.extend({}, defaults);

    /**
     * The single tooltip node which will be placed at the end of the body and is filled with
     * current tooltip content. The node is created from the given #template
     *
     * @type {jQuery}
     */
    var tooltipBox = null;

    /**
     * If the tooltip is currently enabled.
     * @type {boolean}
     */
    var tooltipEnabled = false;

    /**
     * Finds the tooltip content based on #settings.attributes.tooltipText and
     * #settings.attributes.tooltipMarkup.
     *
     * @param settings {{}} the current settings to use, see #defaults
     * @param element the element which may have a tooltip
     * @returns {jQuery} the tooltip node which should be placed inside the tooltip template
     */
    var findTooltipContent = function(settings, element) {
        if (element.attr(settings.attributes.disabled)) {
            // never return tooltip content, if the tooltip is disabled.
            return null;
        }
        var contentSelector = element.attr(settings.attributes.tooltipMarkup);
        var tooltipMarkup = null;
        if (contentSelector && $.fn.findX) {
            tooltipMarkup = element.findX(contentSelector);
        }
        else if (contentSelector && !$.findX) {
            tooltipMarkup = $(contentSelector);
        }
        if (tooltipMarkup != null && tooltipMarkup.length != 0) {
            tooltipMarkup = tooltipMarkup.first().clone();
            tooltipMarkup.show();
            return tooltipMarkup;
        }
        var tooltipText = null;
        $.each(settings.attributes.tooltipText, function(index, attribute) {
            if (tooltipText) {
                return;
            }
            tooltipText = element.attr(attribute);
            if (!tooltipText) {
                // check temporary stored tooltip text, maybe the tooltip is visible at the moment
                tooltipText = element.data(DATA_STORE_PREFIX + attribute);
            }
        });
        if (tooltipText) {
            tooltipText = settings.titleCallback(tooltipText, element);
            tooltipText = $(settings.titleAttributeWrapper).html(tooltipText);
            return tooltipText;
        }
        return null;
    };

    /**
     *
     * @param settings
     * @param element
     * @param position
     * @param checkAlternate
     * @returns {boolean}
     */
    var findPositionForTooltip = function(settings, element, position, checkAlternate) {
        var $window = $(window);
        tooltipBox.css({
            left: 'auto',
            top: 'auto',
            bottom: 'auto',
            right: 'auto'
        });
        $.each(settings.position.alternates, function(key) {
            tooltipBox.removeClass(key);
        });
        tooltipBox.addClass(position);
        var offset = element.offset();
        var width = element.outerWidth();
        var height = element.outerHeight();
        var viewPortHeight = $window.height();
        var viewPortWidth = $window.width();
        if (position[0] == 'n') {
            tooltipBox.css({bottom: viewPortHeight - offset.top});
        }
        else if (position[0] == 's') {
            tooltipBox.css({top: offset.top + height});
        }
        if (position.match(/e/)) {
            tooltipBox.css({left: offset.left + width});
        }
        else if (position.match(/w/)) {
            tooltipBox.css({right: viewPortWidth - offset.left});
        }
        else {
            tooltipBox.css({left: offset.left + (width / 2) - (tooltipBox.outerWidth(true) / 2)});
        }
        if (position[0] != 'n' && position[0] != 's') {
            tooltipBox.css({top: offset.top + (height / 2) - (tooltipBox.outerHeight(true) / 2)});
        }
        // check if tooltip is in viewport
        var tooltipOffset = tooltipBox.offset();
        var tooltipHeight = tooltipBox.outerHeight();
        var tooltipWidth = tooltipBox.outerWidth();

        if (tooltipOffset.left < $window.scrollLeft() || tooltipOffset.top < $window.scrollTop()
                || tooltipOffset.left + tooltipWidth > viewPortWidth + $window.scrollLeft()
                || tooltipOffset.top + tooltipHeight > viewPortHeight + $window.scrollTop()) {
            // maybe try alternate positions
            if (!checkAlternate) {
                return false;
            }
            for (var i = 0; i < settings.position.alternates[position].length; i++) {
                if (findPositionForTooltip(
                        settings,
                        element,
                        settings.position.alternates[position][i],
                        false)) {
                    return true;
                }
            }
            return false;
        }
        return true;
    };

    /**
     * Hides the current tooltip.
     */
    var hideTooltip = function() {
        if (tooltipBox != null) {
            tooltipBox.hide();
        }
    };

    /**
     * Shows the given tooltipMarkup as tooltip for the given element with the given settings.
     *
     * @param settings
     * @param element
     * @param tooltipMarkup
     */
    var showTooltip = function(settings, element, tooltipMarkup) {
        $.each(settings.attributes.tooltipText, function(index, attribute) {
            element.data(DATA_STORE_PREFIX + attribute, element.attr(attribute));
            element.removeAttr(attribute);
        });
        if (tooltipBox == null) {
            tooltipBox = $(settings.template);
            $('body').append(tooltipBox);
        }
        tooltipBox.removeAttr('class');
        var content = tooltipBox.find(settings.templateContentSelector);
        content.html('');
        content.append(tooltipMarkup);
        tooltipBox.attr('class', $(settings.template).attr('class'));
        var cssClasses = element.attr(settings.attributes.tooltipCssClasses);
        if (cssClasses) {
            tooltipBox.addClass(cssClasses);
        }
        var originalOpacity = tooltipBox.css('opacity');
        tooltipBox.css({opacity: 0});
        tooltipBox.show();
        var position = element.attr(settings.attributes.position);
        if (!position) {
            position = settings.position.defaultPosition;
        }
        if (!findPositionForTooltip(settings, element, position, true)) {
            tooltipBox.hide();
        }
        tooltipBox.css({opacity: originalOpacity});
    };

    /**
     * Disables all tooltips with the given settings.
     */
    var disableTooltip = function() {
        $(document).off(EVENT, '*');
        tooltipEnabled = false;
        hideTooltip();
        tooltipBox.detach();
        tooltipBox = null;
    };

    /**
     * Enables all tooltips with the given settings.
     *
     * @param settings {{}} the current settings to use, see #defaults
     */
    var enableTooltip = function(settings) {
        $(document).on(EVENT, '*', function(e) {
            var element = $(this);
            if (element.is('html')) {
                hideTooltip();
            }

            var tooltipMarkup = findTooltipContent(settings, $(this));
            if (tooltipMarkup == null) {
                return;
            }
            e.stopImmediatePropagation();
            e.stopPropagation();
            e.preventDefault();
            showTooltip(settings, element, tooltipMarkup);
        });
        tooltipEnabled = true;
    };

    /**
     * Helper function to extend the global settings.
     */
    var extendSettings = function(options) {
        globalSettings = $.extend(globalSettings, options);
    };

    /**
     * Updates the settings with the first given argument. Preserves the current enabled state of
     * the tooltip.
     */
    $.tooltip = function(options) {
        var doEnable = false;
        if (tooltipEnabled) {
            doEnable = true;
            disableTooltip(globalSettings);
        }
        extendSettings(options || {});
        if (doEnable) {
            enableTooltip(globalSettings);
        }
    };

    /**
     * Updates the settings with the first given argument and enables the tooltip with these
     * settings.
     */
    $.tooltip.on = function(options) {
        if (tooltipEnabled) {
            disableTooltip(globalSettings);
        }
        extendSettings(options || {});
        enableTooltip(globalSettings);
    };

    /**
     * Disables all tooltips. Updates the settings with the first given argument for the next
     * enable of the tooltips.
     */
    $.tooltip.off = function(options) {
        if (tooltipEnabled) {
            disableTooltip(globalSettings);
        }
        extendSettings(options || {});
    };

    /**
     * Delegates to $.tooltip.
     */
    $.fn.tooltip = function(options) {
        $.tooltip(options || {});
    };

    /**
     * Disables the tooltip for the current elements.
     */
    $.fn.tooltipOff = function() {
        this.each(function() {
            var element = $(this);
            element.attr(globalSettings.attributes.disabled, true);
            element.trigger(EVENT);
        });
        return this;
    };

    /**
     * Enables the tooltip for the current elements.
     */
    $.fn.tooltipOn = function() {
        this.each(function() {
            var element = $(this);
            element.removeAttr(globalSettings.attributes.disabled);
        });
        return this;
    };


})(jQuery, window);