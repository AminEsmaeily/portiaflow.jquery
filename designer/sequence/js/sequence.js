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
                hostElement : 'sequence',
                drawGridLines : true,
                customElements : [],
                modelChanged : null,
                selectedNodeChanged : null
            }, options || {});

            
            var mainElements = 
                {
                    title: 'Main Elements',
                    controls: [
                        {
                            name: 'sequence',
                            title: 'Sequence',
                            icon: 'fa-sitemap',
                            class: 'element-sequence',
                            constructor: function(isHost){
                                var element = getContainerElement('sequence', isHost);
                
                                updateSequenceContent(element);
                                return element;
                            },
                            validate: function(node){
                                var dom = $(node);
                                if(!dom.hasClass('element-sequence'))
                                    throw new Error("Invalid control passed for validation.");

                                var errorList = [];
                                
                                var children = $(dom.find('.panel-body').first()).children('.sequence-control');
                                $.each(children, function(){
                                    var name = $(this).attr('name');
                                    var info = getElement(name);
                                    if(info === null)
                                        throw new Error("Element with name " + name + " not found.");

                                    if($.isFunction(info.validate)){
                                        var errors = info.validate($(this));
                                        setErrorIcon($(this), errors);
                                        $.each(errors, function(){
                                            errorList.push(this);
                                        });
                                    }
                                });

                                setErrorIcon(dom, errorList);
                                return errorList;
                            }
                        },
                        {
                            name: 'if',
                            title: 'If',
                            icon: 'fa-exchange',
                            class: 'element-if',
                            constructor: function(isHost){
                                var element = getContainerElement('if', isHost);
                
                                var body = $(element.find('.panel-body').first());
                                var conditionRow = $('<div></div>')
                                    .addClass('row sequence-row')
                                    .append($('<label>Condition</label>'))
                                    .append($('<br/>'))
                                    .append($('<input type="text"/>')
                                        .addClass('condition-input')
                                        .addClass('form-control'))
                                    .appendTo(body);

                                conditionRow.children('input[type="text"]').on('change', function(){
                                    validateFlow();
                                });
                
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
                            },
                            validate: function(node){
                                var dom = $(node);
                                if(!dom.hasClass('element-if'))
                                    throw new Error("Invalid control passed for validation.");

                                var errorList = [];
                                var condition = dom.find('.condition-input').first();
                                if(condition.val().trim() === '')
                                    errorList.push('Please set condition');

                                var ifCol = $(dom.find('.container-if').first()).children('.sequence-control');
                                var elseCol = $(dom.find('.container-else').first()).children('.sequence-control');

                                if(ifCol !== undefined && ifCol !== null && ifCol.length > 0){
                                    var name = $(ifCol).attr('name');
                                    var info = getElement(name);
                                    if(info === null)
                                        throw new Error("Element with name " + name + " not found.");

                                    if($.isFunction(info.validate)){
                                        var errors = info.validate(ifCol);
                                        setErrorIcon(ifCol, errors);
                                        $.each(errors, function(){
                                            errorList.push(this);
                                        });
                                    }
                                }

                                if(elseCol !== undefined && elseCol !== null && elseCol.length > 0){
                                    var name = $(elseCol).attr('name');
                                    var info = getElement(name);
                                    if(info === null)
                                        throw new Error("Element with name " + name + " not found.");

                                    if($.isFunction(info.validate)){
                                        var errors = info.validate(elseCol);
                                        setErrorIcon(elseCol, errors);
                                        $.each(errors, function(){
                                            errorList.push(this);
                                        });
                                    }
                                }

                                setErrorIcon(dom, errorList);
                                return errorList;
                            }
                        },
                        {
                            name: 'while',
                            title: 'While',
                            icon: 'fa-refresh',
                            class: 'element-while',
                            constructor: function(isHost){
                                var element = getContainerElement('while', isHost);
                
                                var body = $(element.find('.panel-body').first());
                
                                var conditionRow = $('<div></div>')
                                    .addClass('row sequence-row')
                                    .append($('<label>Condition</label>'))
                                    .append($('<br/>'))
                                    .append($('<input type="text"/>')
                                        .addClass('condition-input')
                                        .addClass('form-control'))
                                    .appendTo(body);
                                    
                                conditionRow.children('input[type="text"]').on('change', function(){
                                    validateFlow();
                                });
                
                                var loopRow = $('<div></div>')
                                    .addClass('row sequence-row')
                                    .append($('<div></div>')
                                        .addClass('col-lg-12 col-md-12 col-sm-12 col-xs-12 column container-div')
                                        .css('padding', '0px')
                                        .append(getDropZone()))
                                    .css('margin-top', '5px')
                                    .appendTo(body);
                
                
                                return element;
                            },
                            validate: function(node){
                                var dom = $(node);
                                if(!dom.hasClass('element-while'))
                                    throw new Error("Invalid control passed for validation.");

                                var errorList = [];
                                var condition = dom.find('.condition-input').first();
                                if(condition.val().trim() === '')
                                    errorList.push('Please set condition');
                                    
                                var loop = $(dom.find('.container-div').first()).children('.sequence-control');
                                if(loop !== undefined && loop !== null && loop.length > 0){
                                    var name = $(loop).attr('name');
                                    var info = getElement(name);
                                    if(info === null)
                                        throw new Error("Element with name " + name + " not found.");

                                    if($.isFunction(info.validate)){
                                        var errors = info.validate(loop);
                                        setErrorIcon(loop, errors);
                                        $.each(errors, function(){
                                            errorList.push(this);
                                        });
                                    }
                                }

                                setErrorIcon(dom, errorList);
                                return errorList;
                            }
                        },
                        {
                            name: 'assign',
                            title: 'Assign',
                            icon: 'exchange-alt fa-exchange',
                            class: 'element-assign',
                            constructor: function(isHost){
                                var info = getElement('assign');
                                var element = getContainerElement(info.name, isHost);
                
                                var body = $(element.find('.panel-body').first());
                
                                var casesRow = $('<div></div>')
                                    .addClass('row sequence-row')
                                    .appendTo(body);
                
                                var variableColumn = $('<div></div>')
                                    .addClass('column')
                                    .append($('<label>Variable/Argument</label>'))
                                    .append($('<br/>'))
                                    .append($('<select></select>')
                                            .addClass('form-control'))
                                    .appendTo(casesRow);

                                variableColumn.children('select').on('change', function(){
                                    validateFlow();
                                });
                
                                var valueColumn = $('<div></div>')
                                    .addClass('column')
                                    .append($('<label>Value</label>'))
                                    .append($('<br/>'))
                                    .append($('<input type="text"/>')
                                            .addClass('form-control'))
                                    .appendTo(casesRow);   
                                    
                                valueColumn.children('input[type="text"]').on('change', function(){
                                    validateFlow();
                                });
                
                                return element;
                            },
                            validate: function(node){
                                var dom = $(node);
                                if(!dom.hasClass('element-assign'))
                                    throw new Error("Invalid control passed for validation.");

                                var errorList = [];
                                var variable = dom.find('select').first();
                                if(variable.val() === '' || variable.val() === null)
                                    errorList.push('Please select Variable/Argument');
                                    
                                var value = dom.find('input[type="text"]').first();
                                if(value.val().trim() === '')
                                    errorList.push('Please set the value of the variable.');

                                setErrorIcon(dom, errorList);
                                return errorList;
                            }
                        }
                    ]
                };

            // Private methods
            var init = function(element){
                $(element).addClass('design-panel');

                var hostItem = getElement(settings.hostElement);
                if(hostItem !== null && hostItem !== undefined){
                    var newElement = hostItem.constructor(true);
                    element.append(newElement);
                    if(hostItem.validate !== undefined && $.isFunction(hostItem.validate))
                        hostItem.validate(newElement);
                }

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

            var getElement = function(elementName){
                var groups = [];
                groups.push(mainElements);
                $.each(settings.customElements, function(){
                    groups.push(this);
                });

                for(var i = 0; i < groups.length; i++){
                    for(var j = 0; j < groups[i].controls.length; j++){
                        if(groups[i].controls[j].name === elementName)
                            return groups[i].controls[j];
                    }
                }
            }

            // This method constructs the main skleton of the element
            var getContainerElement = function(controlName, isHost = false){
                if(controlName === undefined)
                    throw 'Control name is undefined.';

                var controlInfo = getElement(controlName);

                if(controlInfo === null)
                    throw 'Control with name ' + controlName + ' not found.';

                var id = 'content' + newUniqId();
                var element = $('<div></div>')
                    .attr('id', id)
                    .addClass('sequence-control')
                    .addClass('panel card')
                    .addClass('text-body')
                    .addClass('panel-default bg-default')
                    .addClass(controlInfo.class)
                    .attr('name', controlName);

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

                                        if(containerNode.hasClass('element-sequence')){
                                            target.remove();
                                            updateSequenceContent(containerNode);
                                        }
                                        else{
                                            target.replaceWith(getDropZone());
                                            target.remove();
                                        }

                                        validateFlow();
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

                var errorIcon = $('<span name="error"></span>')
                    .addClass('text-danger')
                    .addClass('error')
                    .append($('<i class="fa fa-warning"></i>'))
                    .appendTo(header);

                errorIcon.attr('title', 'Please fix errors');

                header.append($('<i class="fa '+controlInfo.icon+'"></i>'));
                header.append(controlInfo.title);

                var body =  $('<div></div>')
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
                        var replaceItem = draggable;
                        if(draggableParent.length === 0){
                            var groups = [];
                            groups.push(mainElements);
                            $.each(settings.customElements, function(){
                                groups.push(this);
                            });

                            for(var i = 0; i < groups.length; i++){
                                for(var j = 0; j < groups[i].controls.length; j++){
                                    if(draggable.hasClass(groups[i].controls[j].class)){
                                        try{
                                            if($.isFunction(groups[i].controls[j].constructor))
                                                replaceItem = groups[i].controls[j].constructor(false);
                                            else{
                                                console.error('Constructor for type ' + groups[i].controls[j].name + ' is not defined');
                                                replaceItem = null;
                                            }
                                            break;
                                        }
                                        catch(ex){
                                            console.error(ex);
                                        }
                                    }
                                }
                            }
                        }
                        
                        if(replaceItem == null)
                            return;

                        $(this).replaceWith(replaceItem);
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

                        validateFlow();
                    }
                });

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

            var setErrorIcon = function(element, errors){
                var errorIcon = $($(element).children('.card-header').first()).children('span.error');
                if(errors === null || errors === undefined ||
                    errors.length === 0)
                    errorIcon.css('display', 'none');
                else{
                    errorIcon.css('display', 'block');
                    var title = "";
                    $.each(errors, function(i, message){
                        title = title + '\r\n'+ message;
                    });
                    errorIcon.attr('title', title);
                }
            }

            var validateFlow = function(){
                var firstChild = designer.children('.sequence-control').first();
                if(firstChild.length === 0)
                    return;

                var info = getElement(firstChild.attr('name'));
                if(info === null)
                    throw new Error("Element with name " + firstChild.attr('name') + " not found.");

                if($.isFunction(info.validate))
                    info.validate(firstChild);
            }

            // Public functions
            this.getElements = function(){
                var groups = [];
                groups.push(mainElements);
                $.each(settings.customElements, function(){
                    groups.push(this);
                });

                return groups;
            }

            this.getElementStructure = function(elementName){
                return getContainerElement(elementName);
            }

            var designer = init(this);
            return designer;
        }
    })
);