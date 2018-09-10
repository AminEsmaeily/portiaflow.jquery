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
                var seconElement = getIfControl();
                var thirdElement = getWhilecontrol();
                var fourthElement = getSequenceControl();
                seconElement.appendTo(firstElement.find('.card-body').first());
                thirdElement.appendTo(firstElement.find('.card-body').first());
                updateSequenceContent(firstElement);
                fourthElement.appendTo(seconElement.find('.container-if').first());
                firstElement.appendTo(element);
                return null;
            }
                        
            var isDropCatched = false;

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
                    .addClass('sequence-control')
                    .addClass('panel card')
                    .addClass('text-body')
                    .addClass('panel-default bg-default');

                element.click(function(event){
                    event.stopPropagation();
                    $('.bg-info').addClass('bg-default');
                    $('.bg-info').removeClass('bg-info');
                    $(this).addClass('bg-info');
                    $(this).removeClass('bg-default');
                });

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
                    /*.attr('data-toggle', 'collapse')
                    .attr('href', '#'+id)
                    .attr('aria-expanded', 'true')
                    .attr('aria-controls', id)*/
                    .append($('<i class="fa fa-chevron-up"></i>'))
                    .appendTo(header);

                collapseButton.click(function(event){
                    event.stopPropagation();
                    var body = $(this).parents('.card').first().find('.card-body');
                    if(body.css('display') === 'none')
                    {
                        $(this).children().removeClass('fa-chevron-down');
                        $(this).children().addClass('fa-chevron-up');
                    }
                    else
                    {
                        $(this).children().removeClass('fa-chevron-up');
                        $(this).children().addClass('fa-chevron-down');
                    }
                    body.slideToggle('slow');
                });

                var body =  $('<div></div>')
                    .attr('id', id)
                    .addClass('panel-body card-body')
                    .appendTo(element);

                // Making draggable
                var firstOffset = element.offset();
                element.draggable(
                    {
                        handle : ".panel-header",
                        start : function(event, ui){
                            element.addClass("element-dragging");
                            isDropCatched = false;
                            firstOffset = element.offset();
                        },
                        stop : function(event, ui){
                            element.removeClass("element-dragging");
                            if(!isDropCatched){
                                element.offset(
                                    {
                                        left : firstOffset.left - $('.design-panel').scrollLeft(),
                                        top : firstOffset.top - $('.design-panel').scrollTop()
                                    }
                                );
                                
                                // Enforcing the jquery to reposition the element in case of scrolling view
                                if(element.offset().left !== firstOffset.left ||
                                    element.offset().top !== firstOffset.top){
                                    element.offset(
                                        {
                                            left : firstOffset.left - $('.design-panel').scrollLeft(),
                                            top : firstOffset.top - $('.design-panel').scrollTop()
                                        }
                                    );
                                }
                            }
                        }
                    });
                //==================

                return element;
            }

            var getDropZone = function(){
                var element = $('<div></div>')
                    .addClass('drop-zone')
                    .append('<i class="fa fa-lg fa-caret-down"></i>');

                element.droppable({
                    acceptable : '.sequence-control',
                    activeClass: "droppable-active-class",
                    hoverClass: "droppable-hover-class",
                    tolerance: "pointer",
                    drop : function(event, ui){
                        event.preventDefault();
                        isDropCatched = true;
                        var draggable = $(ui.draggable.first());
                        var draggableParent = draggable.parents('.sequence-control').first();
                        var droppableParent = $(this).parents('.sequence-control').first();

                        var directParent = draggable.parent();
                        
                        $(this).replaceWith(draggable);
                        draggable.css('top', '0');
                        draggable.css('left', '0');

                        if(draggableParent.hasClass('element-sequence'))
                            updateSequenceContent(draggableParent);

                        if(droppableParent.hasClass('element-sequence'))
                            updateSequenceContent(droppableParent);

                        if(directParent.hasClass('container-div')){
                            directParent.children().remove();
                            directParent.append(getDropZone());
                        }
                    }
                });

                return element;
            }

            // this method constructs a Sequence node
            var getSequenceControl = function(){
                var element = getContainerElement();
                element.addClass('element-sequence');
                var header = $(element.find('.panel-header').first());
                header.append($('<i class="fa fa-sitemap"></i>')); 
                header.append('Sequence');

                updateSequenceContent(element);
                return element;
            }

            // This method rearrange content of the sequence node
            var updateSequenceContent = function(sender){
                var body = $($(sender).find('.panel-body').first());
                body.children('.drop-zone').remove();
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
            }

            // This method creates an If element
            var getIfControl = function(){
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
                    .addClass('column')
                    .append($('<label>If</label>'))
                    .append($('<br/>'))
                    .append($('<div></div>')
                        .addClass('container-div')
                        .addClass('container-if')
                        .append(getDropZone()))
                    .appendTo(casesRow);

                var elseColumn = $('<div></div>')
                    .addClass('column')
                    .append($('<label>Else</label>'))
                    .append($('<br/>'))
                    .append($('<div></div>')
                        .addClass('container-div')
                        .addClass('container-else')
                        .append(getDropZone()))
                    .appendTo(casesRow);

                return element;
            }

            var getWhilecontrol = function(){
                var element = getContainerElement();
                element.addClass('element-while');

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
                        .addClass('col-lg-12 col-md-12 col-sm-12 col-xs-12 column container-div')
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