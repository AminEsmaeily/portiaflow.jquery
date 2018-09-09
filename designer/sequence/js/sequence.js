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
                var seconElement = getIfElement();
                var thirdElement = getWhileElement();
                seconElement.appendTo(firstElement.find('.card-body').first());
                thirdElement.appendTo(firstElement.find('.card-body').first());
                updateSequenceContent(firstElement);
                firstElement.appendTo(element);
                return null;
            }

            var newUniqId = function() {
                return 'xxxxxxxxxxxx'.replace(/[xy]/g,
                function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
                }).toUpperCase();
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

                var id = 'content' + newUniqId();

                var collapseButton = $('<a></a>')
                    .addClass('btn-collapse')
                    .attr('data-toggle', 'collapse')
                    .attr('href', '#'+id)
                    .attr('aria-expanded', 'true')
                    .attr('aria-controls', id)
                    .append($('<i class="fa fa-chevron-down"></i>'))
                    .appendTo(header);

                var body =  $('<div></div>')
                    .attr('id', id)
                    .addClass('collapse show')
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

            // This method creates an If element
            var getIfElement = function(){
                var element = getContainerElement();
                element.addClass('element-if');

                var header = $(element.find('.panel-header').first());
                header.append($('<i class="fa fa-exchange"></i>')); 
                header.append('If');

                var body = $(element.find('.panel-body').first());
                var conditionRow = $('<div></div>')
                    .addClass('row sequence-row')
                    .append($('<label>Condition</label>'))
                    .append($('<br/>'))
                    .append($('<input type="text"/>')
                        .addClass('condition-input'))
                    .appendTo(body);

                var casesRow = $('<div></div>')
                    .addClass('row sequence-row')
                    .appendTo(body);

                var ifColumn = $('<div></div>')
                    .addClass('col-xl-6 col-lg-6 col-md-6 col-sm-6 col-xs-6 column')
                    .append($('<label>If</label>'))
                    .append($('<br/>'))
                    .append($('<div></div>')
                        .addClass('container-div')
                        .append(getDropZone()))
                    .appendTo(casesRow);

                var elseColumn = $('<div></div>')
                    .addClass('col-xl-6 col-lg-6 col-md-6 col-sm-6 col-xs-6 column')
                    .append($('<label>Else</label>'))
                    .append($('<br/>'))
                    .append($('<div></div>')
                        .addClass('container-div')
                        .append(getDropZone()))
                    .appendTo(casesRow);

                return element;
            }

            var getWhileElement = function(){
                var element = getContainerElement();
                element.addClass('element-if');

                var header = $(element.find('.panel-header').first());
                header.append($('<i class="fa fa-refresh"></i>')); 
                header.append('While');

                var body = $(element.find('.panel-body').first());

                var conditionRow = $('<div></div>')
                    .addClass('row sequence-row')
                    .append($('<label>Condition</label>'))
                    .append($('<br/>'))
                    .append($('<input type="text"/>')
                        .addClass('condition-input'))
                    .appendTo(body);

                var loopRow = $('<div></div>')
                    .addClass('row sequence-row')
                    .append($('<div></div>')
                        .addClass('col-xl-12 col-lg-12 col-md-12 col-sm-12 col-xs-12 column container-div')
                        .css('padding', '0px')
                        .append(getDropZone()))
                    .css('margin-top', '5px')
                    .appendTo(body);


                return element;
            }

            return init(this);
        }
    })
);