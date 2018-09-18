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
        $.fn.seqDesigner = function(options){
            // Configuring settings
            var settings = $.fn.extend({
                toolbar : { visible : false },
                hostElement : 'sequence',
                drawGridLines : true,
                modelChanged : null,
                selectedNodeChanged : null
            }, options || {});

            // Elements List
            var elements = {
                mainElements : [
                    {
                        name: 'sequence',
                        title: 'Sequence',
                        icon: 'fa-sitemap',
                        class: 'element-sequence'
                    },
                    {
                        name: 'if',
                        title: 'If',
                        icon: 'fa-exchange',
                        class: 'element-if'
                    },
                    {
                        name: 'while',
                        title: 'While',
                        icon: 'fa-refresh',
                        class: 'element-while'
                    }
                ]
            };

            // Private methods
            var init = function(element){
                $(element).addClass('design-panel');

                if(settings.hostElement === 'sequence')
                    element.append(getSequenceControl(true));
                else if(settings.hostElement === 'if')
                    element.append(getIfControl(true));
                else if(settings.hostElement === 'while')
                    element.append(getWhileControl(true));

                if(settings.drawGridLines)
                    element.addClass('grid-background');
                return element;
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
            var getContainerElement = function(controlName, isHost){
                if(controlName === undefined)
                    throw 'Control name is undefined.';

                var controlInfo = null;
                for(var index = 0; index < elements.mainElements.length; index++){
                    if(elements.mainElements[index].name === controlName){
                        controlInfo = elements.mainElements[index];
                        break;
                    }
                }

                if(controlInfo === null)
                    throw 'Control with name ' + controlName + ' not found.';

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

                if(isHost !== undefined && isHost !== null && !isHost){
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
                }

                var id = 'content' + newUniqId();

                var collapseButton = $('<a></a>')
                    .addClass('btn-collapse')
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

                header.append($('<i class="fa '+controlInfo.icon+'"></i>'));
                header.append(controlInfo.title);

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
                        },
                        revert : function(event, ui) {
                            $(this).data("uiDraggable").originalPosition = {
                                top : 0,
                                left : 0
                            };
                            return !event;
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

                        var isFromDesigner = draggable.find('.card-header').length > 0;

                        var droppableParent = $(this).parents('.sequence-control').first();
                        if(isFromDesigner){
                            var draggableParent = draggable.parents('.sequence-control').first();
                            var directParent = draggable.parent();
                            
                            $(this).replaceWith(draggable);
                            draggable.css('top', '0');
                            draggable.css('left', '0');

                            if(draggableParent.hasClass('element-sequence'))
                                updateSequenceContent(draggableParent);

                            if(directParent.hasClass('container-div')){
                                directParent.children().remove();
                                directParent.append(getDropZone());
                            }
                        }
                        else{
                            var newElement;
                            if(draggable.hasClass('element-sequence'))
                                newElement = getSequenceControl(false);
                            else if(draggable.hasClass('element-if'))
                                newElement = getIfControl(false);
                            else if(draggable.hasClass('element-while'))
                                newElement = getWhileControl(false);

                            $(this).replaceWith(newElement);
                        }

                        if(droppableParent.hasClass('element-sequence'))
                            updateSequenceContent(droppableParent);
                    }
                });

                return element;
            }

            // this method constructs a Sequence node
            var getSequenceControl = function(isHost){
                var element = getContainerElement('sequence', isHost);
                element.addClass('element-sequence');

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
            var getIfControl = function(isHost){
                var element = getContainerElement('if', isHost);
                element.addClass('element-if');

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

            var getWhileControl = function(isHost){
                var element = getContainerElement('while', isHost);
                element.addClass('element-while');

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

            this.getElements = function(){
                return elements;
            }

            var designer = init(this);
            return designer;
        }
    })
);