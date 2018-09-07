(function (factory) {
    "use strict";

    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery'], function ($) {
            return factory($, window, document);
        });
    }
    else if (typeof exports === 'object') {
        // CommonJS
        module.exports = function (root, $) {
            if (!root) {
                // CommonJS environments without a window global must pass a
                // root. This will give an error otherwise
                root = window;
            }

            if (!$) {
                $ = typeof window !== 'undefined' ? // jQuery's factory checks for a global window
                    require('jquery') :
                    require('jquery')(root);
            }

            return factory($, root, root.document);
        };
    }
    else {
        // Browser
        factory(jQuery, window, document);
    }
}

    (function($, window, document, undefined){
        $.fn.diagram = function(options){
            // Configuring settings
            var settings = $.fn.extend({
                toolbar : { visible : false },
                hostControl : 'sequence',
                drawGridLines : true,
                modelChanged : null,
                selectedNodeChanged : null
            }, options || {});

            // Private methods
            var init = function(element){
                $(element).addClass('design-panel');

                var firstElement =getSequenceControl();
                var seconElement = getSequenceControl();
                seconElement.appendTo(firstElement.find('.card-body'));
                updateSequenceContent(firstElement);
                firstElement.appendTo(element);
                return null;
            }

            // This method constructs the main skleton of the element
            var getContainerElement = function(){
                var element = $('<div></div>')
                    .addClass('panel card')
                    .addClass('panel-default bg-default');

                var header = $('<div></div>')
                    .addClass('panel-header card-header')
                    .appendTo(element);

                var closeBtn = $('<a></a>')
                    .addClass('close')
                    .attr('aria-label', 'Close')
                    .append($('<span aria-hidden="true">&times;</span>'))
                    .appendTo(header);

                closeBtn.on('click', function(){
                    $.confirm({
                        title: 'Delete',
                        content: 'Are you sure to remove node?',
                        buttons: {
                            yes: {
                                text: 'Yes',
                                btnClass: 'btn-red',
                                keys: ['enter', 'shift'],
                                action: function(){
                                    var target = $(closeBtn.parents('.card').first());
                                    var containerNode = $(target.parents('.card').first()); 
                                    target.remove();

                                    if(containerNode.hasClass('element-sequence'))
                                        updateSequenceContent(containerNode);
                                }
                            },
                            no: {
                                text: 'No',
                                btnClass: 'btn-blue',
                                action: function(){}
                            }
                        }
                    });
                });

                var body =  $('<div></div>')
                    .addClass('panel-body card-body')
                    .appendTo(element);

                return element;
            }

            var getDropZone = function(){
                var element = $('<div></div>')
                    .addClass('drop-zone')
                    .append('<i class="fa fa-lg fa-caret-down"></i>');

                return element;
            }

            // this method constructs a Sequence node
            var getSequenceControl = function(){
                var element = getContainerElement();
                element.addClass('element-sequence');
                //fa-sitemap
                var header = $(element.find('.panel-header').first());
                header.append($('<i class="fa fa-sitemap"></i>')); 
                header.append('Sequence');

                updateSequenceContent(element);
                return element;
            }

            // This method rearrange content of the sequence node
            var updateSequenceContent = function(sender){
                    var body = $($(sender).find('.panel-body').first());
                    body.children().remove('.drop-zone');

                    var children = body.children();
                    var drpZone = getDropZone();
                    if(children.length === 0)
                        drpZone.appendTo(body);
                    else
                        drpZone.insertBefore(children.first());
                    $.each(children, function(i, e){
                        drpZone = getDropZone();
                        drpZone.insertAfter(e);
                    });

                    body.children('.drop-zone').on('drop', function(event){
                        event.preventDefault();  
                        event.stopPropagation();
                        updateSequenceContent(sender);
                    }); 
            }

            var getIfElement = function(){
                var element = getContainerElement();
                element.addClass('element-if');

                var header = $(element.find('.panel-header').first());
                header.append($('<i class="fa fa-sitemap"></i>')); 
                header.append('Sequence');
            }

            return init(this);
        }
    })
);