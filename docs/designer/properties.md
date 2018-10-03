## Properties
### List of properties

- #### customElements
    Default: null  
  You can pass your custom activities to workflow. It holds a list of JSON objects that in the first level of this, it contains groups of items. Each group contains a set of controls that can be used in designer and engine.
  ``` js
  var diagram = $('<div></div>').seqDesigner(
  {
      hostControl : 'sequence',
      drawGridLines : true,
      customElements : [
          {
              title: 'Math Elements',
              controls:[
                  {
                      name: 'sum',
                      title: 'Sum',
                      icon: 'fa-plus',
                      class: 'element-sum',
                      constructor: function(){
                          var element = diagram.getElementStructure('sum');
                          ...
                          return element;
                      },
                      validate: function(node){
                          var dom = $(node);
                          var errorList = [];
                          ...
                          return errorList;
                      }
                  }
              ]
          },
          {
              title: 'Other Group',
              controls:[
                ...
              ]
          },
          ...
      ],
      modelChanged : function(){
          //$("#jsonStructure").jJsonViewer(diagram.getJSON());
      },
      selectedNodeChanged : function(item){
          //$("#varTableContainer").empty();
          //$("#varTableContainer").append(getVariablesTable(item));
      }
  });
  ```
  At the first level of this structure, we should declare a group and set it's *title*. Each group has one/many controls that we can pass them to it using *controls* property. This property accepts a list of control declarations.

- #### drawGridLines
    Default: true  
If you need to have grid lines in background of your designer, you can set it to *true*(or leave it as is), otherwise set it *false*.

- #### hostElement
  Default: sequence  
This property indicates the main element hosted in the designer. The hosted element cannot be removed in desinger.  
Available Values: 
```
  sequence
  if
  while
```