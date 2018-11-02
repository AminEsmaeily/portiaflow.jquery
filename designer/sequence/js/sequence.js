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
                showLog : true,
                modelChanged : null,
                selectedNodeChanged : null,
                onLog : null
            }, options || {});
            
            var mainElements = 
                {
                    title: 'Main Elements',
                    controls: [
/* Sequence */          {
                            name: 'sequence',
                            title: 'Sequence',
                            icon: 'fa-sitemap',
                            class: 'element-sequence',
                            constructor: function(isHost, dataToLoad){
                                var element = getActivityElement('sequence', isHost, dataToLoad);
                
                                if(dataToLoad !== null && dataToLoad !== undefined){
                                    var body = $(element.find('.panel-body').first());
                                    body.empty();

                                    $.each(dataToLoad.children, function(){
                                        var child = loadNode(this, false);
                                        body.append(child);
                                    });
                                }

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
                            },
                            getJSON: function(node){
                                var dom = $(node);
                                var info = getElement($(dom).attr('name'));
                                var children = $(dom.find('.panel-body').first()).children('.sequence-control');

                                var res = {
                                    name: info.name,
                                    id: $(node).attr('id'),
                                    title: info.title,
                                    class: info.class,
                                    children: []
                                };

                                $.each(children, function(){
                                    var dom = $(this);
                                    var name = dom.attr('name');
                                    var info = getElement(name);
                                    if(!$.isFunction(info.getJSON))                                    
                                        return;
                                    res.children.push(info.getJSON(dom));
                                });

                                return res;
                            },
                            execute: function(info){
                                log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Executing...');

                                $.each(info.children, function(){
                                    executeActivity(this);
                                });

                                log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Executed successfully.');
                            }
                        },
/* If */                {
                            name: 'if',
                            title: 'If',
                            icon: 'fa-exchange',
                            class: 'element-if',
                            constructor: function(isHost, dataToLoad){
                                var element = getActivityElement('if', isHost);
                
                                var body = $(element.find('.panel-body').first());
                                var conditionRow = $('<div></div>')
                                    .addClass('row sequence-row')
                                    .append($('<label>Condition</label>'))
                                    .append($('<br/>'))
                                    .append($('<input type="text"/>')
                                        .addClass('condition-input')
                                        .addClass('expressionable')
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
                                    

                                if(dataToLoad !== null && dataToLoad !== undefined){
                                    conditionRow.children('input[type="text"]').val(dataToLoad.condition);
                                    if(dataToLoad.if !== {}){
                                        ifColumn.children('.container-if').empty();
                                        ifColumn.children('.container-if').append(loadNode(dataToLoad.if, false));
                                    }

                                    if(dataToLoad.else !== {}){
                                        elseColumn.children('.container-else').empty();
                                        elseColumn.children('.container-else').append(loadNode(dataToLoad.else, false));
                                    }
                                }
                
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
                            },
                            getJSON: function(node){
                                var dom = $(node);
                                var info = getElement($(dom).attr('name'));

                                var res = {
                                    name: info.name,
                                    id: $(node).attr('id'),
                                    title: info.title,
                                    class: info.class
                                };

                                var rows = dom.children('.panel-body').children('.sequence-row');
                                res.condition = $(rows[0]).children('.condition-input').val();
                                
                                var ifColumn = $(rows[1]).children('.column').children('.container-if');
                                var elseColumn = $(rows[1]).children('.column').children('.container-else');

                                var ifDom = $(ifColumn.children('.sequence-control'));
                                if(ifDom.length === 0)
                                    res.if = {};
                                else{
                                    var name = ifDom.attr('name');
                                    var info = getElement(name);
                                    if($.isFunction(info.getJSON))                                    
                                        res.if = info.getJSON(ifDom);
                                    else
                                        res.if = {};
                                }

                                var elseDom = $(elseColumn.children('.sequence-control'));
                                if(elseDom.length === 0)
                                    res.else = {};
                                else{
                                    var name = elseDom.attr('name');
                                    var info = getElement(name);
                                    if($.isFunction(info.getJSON))
                                        res.else = info.getJSON(elseDom);
                                    else
                                        res.else = {};
                                }

                                return res;
                            },
                            execute: function(info){
                                log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Executing...');
                                if(info.condition.trim() === ''){
                                    log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Condition is not set.', 'error');
                                    throw new Error(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Condition is not set');
                                }

                                var normalizedCondition = info.condition.replace(/\:/g, ' window.globalVariables.');
                                try{
                                    normalizedCondition = 'var conditionResult = ' + normalizedCondition;
                                    $.globalEval(normalizedCondition);
                                }
                                catch(ex){
                                    log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Error in processing condition.\n' + ex.message, 'error');
                                    throw new Error(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Error in processing condition.\n' + ex.message);
                                }

                                if(conditionResult){
                                    if(info.if.name === undefined)
                                        log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => No action to execute.');
                                    else{
                                        executeActivity(info.if);
                                    }
                                }
                                else{
                                    if(info.else.name === undefined)
                                        log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => No action to execute.');
                                    else{
                                        executeActivity(info.else);
                                    }
                                }

                                log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Executed successfully');
                            }
                        },
/* While */             {
                            name: 'while',
                            title: 'While',
                            icon: 'fa-refresh',
                            class: 'element-while',
                            constructor: function(isHost, dataToLoad){
                                var element = getActivityElement('while', isHost);
                
                                var body = $(element.find('.panel-body').first());
                
                                var conditionRow = $('<div></div>')
                                    .addClass('row sequence-row')
                                    .append($('<label>Condition</label>'))
                                    .append($('<br/>'))
                                    .append($('<input type="text"/>')
                                        .addClass('condition-input')
                                        .addClass('expressionable')
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
                
                                if(dataToLoad !== null && dataToLoad !== undefined){
                                    conditionRow.children('input[type="text"]').val(dataToLoad.condition);
                                    if(dataToLoad.loop !== {}){
                                        loopRow.children('.container-div').empty();
                                        loopRow.children('.container-div').append(loadNode(dataToLoad.loop, false));
                                    }
                                }
                
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
                            },
                            getJSON: function(node){
                                var dom = $(node);
                                var info = getElement($(dom).attr('name'));

                                var res = {
                                    name: info.name,
                                    id: $(node).attr('id'),
                                    title: info.title,
                                    class: info.class
                                };

                                var rows = dom.children('.panel-body').children('.sequence-row');
                                res.condition = $(rows[0]).children('.condition-input').val();

                                var container = $($(rows[1]).children('.container-div').children('.sequence-control'));
                                if(container.length === 0)
                                    res.loop = {};
                                else{
                                    var name = container.attr('name');
                                    var info = getElement(name);
                                    if($.isFunction(info.getJSON))
                                        res.loop = info.getJSON(container);
                                    else
                                        res.loop = {};
                                }

                                return res;
                            },
                            execute: function(info){
                                log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Executing...');

                                var normalizedCondition = info.condition.replace(/\:/g, ' window.globalVariables.');
                                try{
                                    $.globalEval('var conditionResult = ' + normalizedCondition);
                                }
                                catch(ex){
                                    log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Error in evaluating the condition.\n' + ex.message, 'error');
                                    throw new Error(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Error in evaluating the condition.\n' + ex.message);
                                }

                                if(info.loop.name !== undefined){
                                    try{
                                        while(conditionResult){
                                            executeActivity(info.loop);
                                            
                                            try{
                                                $.globalEval('conditionResult = ' + normalizedCondition);
                                            }
                                            catch(ex){
                                                log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Error in evaluating the condition.\n' + ex.message, 'error');
                                                throw new Error(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Error in evaluating the condition.\n' + ex.message);
                                            }
                                        }
                                    }
                                    catch(ex){
                                        log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Error in processing the while.\n' + ex.message, 'error');
                                        throw new Error(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Error in processing the while.\n' + ex.message);
                                    }
                                }

                                log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Executed successfully.');
                            }
                        },
/* Assign */            {
                            name: 'assign',
                            title: 'Assign',
                            icon: 'fas fa-sign-in',
                            class: 'element-assign',
                            constructor: function(isHost, dataToLoad){
                                var info = getElement('assign');
                                var element = getActivityElement(info.name, isHost);
                
                                var body = $(element.find('.panel-body').first());
                
                                var casesRow = $('<div></div>')
                                    .addClass('row sequence-row')
                                    .appendTo(body);
                
                                var variableColumn = $('<div></div>')
                                    .addClass('column')
                                    .append($('<label>Variable/Argument</label>'))
                                    .append($('<br/>'))
                                    .append($('<input type="text"/>')
                                            .addClass('form-control')
                                            .addClass('expressionable'))
                                    .appendTo(casesRow);

                                variableColumn.children('input').on('change', function(){
                                    validateFlow();
                                });
                
                                var valueColumn = $('<div></div>')
                                    .addClass('column')
                                    .append($('<label>Value</label>'))
                                    .append($('<br/>'))
                                    .append($('<input type="text"/>')
                                            .addClass('form-control')
                                            .addClass('expressionable'))
                                    .appendTo(casesRow);   
                                    
                                valueColumn.children('input[type="text"]').on('change', function(){
                                    validateFlow();
                                });

                                if(dataToLoad !== null && dataToLoad !== undefined){
                                    variableColumn.children('input').val(dataToLoad.variable);
                                    valueColumn.children('input[type="text"]').val(dataToLoad.value);
                                }
                
                                return element;
                            },
                            validate: function(node){
                                var dom = $(node);
                                if(!dom.hasClass('element-assign'))
                                    throw new Error("Invalid control passed for validation.");

                                var errorList = [];
                                var variable = $(dom.find('.column')[0]).children('input[type="text"]');
                                if(variable.val() === '' || variable.val() === null)
                                    errorList.push('Please enter Variable/Argument');
                                else if(!isValidVariable(variable.val(), false))
                                    errorList.push("Variable name is not valid");

                                    
                                var value = $(dom.find('.column')[1]).children('input[type="text"]');
                                if(value.val().trim() === '')
                                    errorList.push('Please enter the value.');

                                setErrorIcon(dom, errorList);
                                return errorList;
                            },
                            getJSON: function(node){
                                var dom = $(node);
                                var info = getElement($(dom).attr('name'));

                                var res = {
                                    name: info.name,
                                    id: dom.attr('id'),
                                    title: info.title,
                                    class: info.class
                                };

                                var columns = dom.children('.panel-body').children('.sequence-row').children('.column');
                                res.variable = $(columns[0]).children('input.form-control').val();
                                res.value = $(columns[1]).children('input.form-control').val();

                                return res;
                            },
                            execute: function(info){
                                log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Executing...');

                                if(info.variable === null){
                                    log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Variable not set.', 'error');
                                    throw new Error(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Variable not set.');
                                }

                                var command = 'window.globalVariables.' + info.variable + ' = ';
                                if(typeof(variable) === 'string')
                                    command = command + '"' + info.value + '"';
                                else
                                    command = command + info.value;
                                
                                command = command.replace(/\:/g, ' window.globalVariables.');
                                try{
                                    jQuery.globalEval(command);
                                    log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Executed successfully.');
                                }
                                catch(ex){
                                    log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Error in assigning value.\n'+ex.message, 'error');
                                    throw new Error(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Error in assigning value.\n'+ex.message);
                                }
                            }
                        },
/* Write2Console */     {
                            name: 'write2Console',
                            title: 'Write to Console',
                            icon: 'fas fa-terminal',
                            class: 'element-write2console',
                            constructor: function(isHost, dataToLoad){
                                var info = getElement('write2Console');
                                var element = getActivityElement(info.name, isHost);
                
                                var body = $(element.find('.panel-body').first());
                
                                var valueRow = $('<div></div>')
                                    .addClass('row sequence-row')
                                    .appendTo(body);
                
                                var valueColumn = $('<div></div>')
                                    .addClass('column')
                                    .css('width', '100%')
                                    .append($('<label>Message</label>'))
                                    .append($('<br/>'))
                                    .append($('<input type="text"/>')
                                            .addClass('form-control')
                                            .addClass('expressionable'))
                                    .appendTo(valueRow);   
                                    
                                valueColumn.children('input[type="text"]').on('change', function(){
                                    validateFlow();
                                });

                                if(dataToLoad !== null && dataToLoad !== undefined){
                                    valueColumn.children("input[type='text']").val(dataToLoad.message);
                                }
                
                                return element;
                            },
                            validate: function(node){
                                var dom = $(node);
                                if(!dom.hasClass('element-write2console'))
                                    throw new Error("Invalid control passed for validation.");

                                var errorList = [];                                    
                                var value = dom.find('input[type="text"]').first();
                                if(value.val().trim() === '')
                                    errorList.push('Please set the value of the message.');

                                setErrorIcon(dom, errorList);
                                return errorList;
                            },
                            getJSON: function(node){
                                var dom = $(node);
                                var info = getElement($(dom).attr('name'));

                                var res = {
                                    name: info.name,
                                    id: dom.attr('id'),
                                    title: info.title,
                                    class: info.class
                                };

                                var columns = dom.children('.panel-body').children('.sequence-row').children('.column');
                                res.message = $(columns[0]).children('input.form-control').val();

                                return res;
                            },
                            execute: function(info){
                                log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Executing...');
                                var normalizedCondition = info.message.replace(/\:/g, ' window.globalVariables.');
                                var command = 'console.log(' + normalizedCondition + ')';
                                jQuery.globalEval(command);
                                log(info.name + '(<a class="linkToActivity" title="'+ info.id + '">' + info.id + '</a>) => Executed successfully.');
                            }
                        }
                    ]
                };

            // Private methods
            var init = function(element){
                log("Initializing designer");
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

            var getVariablesAndArguments = function(){
                var assignActivities = $('.element-assign');
                var result = [];
                $.each(assignActivities, function(){
                    var input = $($(this).find('.column')[0]).children('.expressionable').val();
                    if(input === undefined || !isValidVariable(input, false))
                        return;

                    result.push(input);
                });
                return $.unique(result);
            }

            var isValidVariable = function(value, shouldHasAnnotation = true){
                if(value === null || value === undefined)
                    return false;

                if(typeof(value) !== 'string')
                    return false;

                var firstChar = value.toLowerCase().substring(0,1);
                if(shouldHasAnnotation){
                    if(firstChar !== ':')
                        return false;

                    firstChar = value.toLowerCase().substring(1,1);
                }

                var validStartChars = 'abcdefghijklmnopqrstuvwxyz'.split('');
                var validChars = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');

                if($.inArray(firstChar, validStartChars) < 0)
                    return false;

                var hasInvalidChar = false;
                value.substring(1).split('').forEach(element => {
                    if($.inArray(element, validChars) < 0)
                        hasInvalidChar = true;
                });

                return !hasInvalidChar;
            }

            var log = function(message, level){
                if(settings.showLog && $.isFunction(settings.onLog)){
                    settings.onLog(
                        {
                            dateTime: new Date(),
                            level: level === undefined || level === null ? 'information' : level,
                            message: message
                        }
                    );

                    $('.linkToActivity').mouseenter(function () { 
                        $('#'+this.title).addClass('bg-warning panel-warning');
                    });

                    $('.linkToActivity').mouseleave(function () { 
                        $('#'+this.title).removeClass('bg-warning panel-warning');
                    });
                }
            }

            // This method constructs the main skleton of the element
            var getActivityElement = function(controlName, isHost = false, dataToLoad){
                if(controlName === undefined)
                    throw 'Control name is undefined.';

                var controlInfo = getElement(controlName);

                if(controlInfo === null)
                    throw 'Control with name ' + controlName + ' not found.';

                var id = dataToLoad === null || dataToLoad === undefined ? 'activity' + newUniqId() : dataToLoad.id;
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
                    if($.isFunction(settings.selectedNodeChanged))
                        settings.selectedNodeChanged($(this));
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
                header.append(dataToLoad === null || dataToLoad === undefined ? controlInfo.title : dataToLoad.title);

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
                    errors.length === 0){
                    errorIcon.css('display', 'none');
                }
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
                    
                if($.isFunction(settings.modelChanged))
                    settings.modelChanged();

                $('.expressionable').autocomplete({
                    source: getVariablesAndArguments()
                });
            }

            var executeActivity = function(activity){
                var info = getElement(activity.name);
                if(info === null || info === undefined){
                    log("executeActivity => Activity with name " + activity.name + " not found", "error");
                    throw new Error("executeActivity => Activity with name " + activity.name + " not found");
                }

                if(!$.isFunction(info.execute)){
                    log("executeActivity => Execute method not declared for " + activity.name, "error");
                    throw new Error("executeActivity => Execute method not declared for " + activity.name);
                }

                var activityDom = $(document).find('#'+activity.id);
                if(activityDom.length > 0){
                    $(document).find('.sequence-control').removeClass('panel-warning');
                    $(document).find('.sequence-control').removeClass('bg-warning');
                    activityDom.addClass('panel-warning bg-warning');
                }

                info.execute(activity, window.globalVariables);
            }

            var loadNode = function(node, isRoot){
                var info = getElement(node.name);
                if(info === null || info === undefined)
                    throw new Error("Element with name " + node.name + " not found.");

                var newActivity = info.constructor(isRoot, node);
                return newActivity;
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
                return getActivityElement(elementName);
            }

            this.getJSON = function(){
                var root = $(designer).children('.sequence-control');
                if(root == null)
                    return;
                var info = getElement(root.attr('name'));
                if(info == null)
                    return;

                if($.isFunction(info.getJSON))
                    return info.getJSON(root);

                return {};
            }

            this.replaceDropZone = function(dropZone, newElementName){
                if(!$(dropZone).hasClass('drop-zone'))
                    throw new Error('This method needs a drop-zone class');
                
                var info = getElement(newElementName);
                if(info === null || info === undefined)
                    throw new Error(newElementName + " is not valid element name");

                var newItem = info.constructor(false);
                var parent = dropZone.parents('.sequence-control').first();
                dropZone.replaceWith(newItem);
                if(parent.hasClass('element-sequence'))
                    updateSequenceContent(parent);
                    
                validateFlow();
            }

            this.run = function(workflow){  
                if(workflow === null || workflow === undefined)
                    workflow = designer.getJSON();

                try{
                    log("Start to run the workflow");
                    window.globalVariables = {};
                    executeActivity(workflow);
                    log("Workflow finished successfully.");
                }
                catch(ex){
                    log("Error in running the workflow.\n" + ex.message, "error");
                }

                $(document).find('.sequence-control').removeClass('panel-warning');
                $(document).find('.sequence-control').removeClass('bg-warning');
            }

            this.load = function(data){
                $(designer).empty();
                if(data === {})
                    return;

                try{
                    log("Loading model...");
                    var parentNode = loadNode(data, true);
                    $(designer).append(parentNode);

                    validateFlow();

                    log("Model loaded successfully.");
                }
                catch(ex){
                    $.alert({
                        title: 'Loading data',
                        content: 'Invalid data found.'
                    });

                    log("Error in loading model. \n" + ex.message, "error");
                }
            }

            this.new = function(){
                $(designer).empty();
                init(designer);
            }

            var designer = init(this);
            return designer;
        }
    })
);