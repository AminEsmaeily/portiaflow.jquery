## Properties
Here is an overview of setting up the Portia Workflow

  ``` javascript
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
     
### List of properties

- #### customElements
    Default: `null`  
  You can pass your custom activities to workflow. It holds a list of JSON objects that in the first level of this, it contains groups of items. Each group contains a set of controls that can be used in designer and engine.
  At the first level of this structure, we should declare a group and set it's `title`. Each group has one/many controls that we can set it using `controls` property. This property accepts a list of control declarations. Required properties for each control are as follows:
- ##### Properties
  - ###### class
    To being able to customize UI of the control in your CSS classes, you can set your custom css class for the element using this property. It's better to use unique class name for each control.
  - ###### icon
    To have a great UI, Portia Workflow uses Font-Awesome library to present elements icon. You can set your favorite icon from Font-Awesome to your control.
  - ###### name
    It indicates the name of the control. Portia Workflow uses this name in internal processes to find your custom controls so it needs to be unique for each item in each group.
  - ###### title
    You can set presented name of your control to `title` property. It will be used in UI.
- ##### Methods
  - ###### constructor
    The `constructor` method is the most important method that should be implemented for each control. Inside this method you should request a new skeleton by calling the `getElementStructure` method of the dwsigner element. This method accepts the `name` of the current element. The `getElementStructure` returns a DOM element with required Header, Content and other basic functionalities such as Drag and Drop. To add your required inputs and UI elements, you have to query the content element from the returned skeleton like below:
    ``` js
    var element = diagram.getElementStructure('sum');
    var body = element.find('.panel-body').first();
    ```
    After initializing the UI, you should return the element to be used in designer and engine.

  - ###### execute
    Inside this method, we can declare behavior of the activity. The Portia Workflow engine uses thid method to execute the activity and submit it's effects inside the flow. Like other methods, this method has an input argument to give access to the desired activity. By using this argument, we can access all inputs and their values inside the activity, Then perform the job that we want.  
    **It's one of the important methods of the Portia Workflow, so create this method with more accuracy.**  
    Following is an example of the execute method. Inside this method we retrieve the value of the user entered message inside the input, then write it into the browser console.
    ``` js  
    execute: function(node){
                var dom = $(node);
                var message = $(dom.find('input.form-control')[0]).val();

                var command = 'console.log("'+message+'")';
                $.eval(command);
                return res;
            }
    ```

  - ###### getJSON
    Portia workflow stores and loads data and structure using JSON format. So we should provide a business to return JSON format of the designed activity. In this case, we have to fetch all of the elements and their values inside the element. This method has an input argument that points to the desired activity. By using this argument, we can access all of needed controls and values. After building and filling up the JSON decleration of the activity, we should return it to caller. The following example demonstrates the JSON creation of the `Write To Console` activity:
    ``` js  
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
            }
    ```

  - ###### validate
    This method helps you to validate the values of the input elements inside the control. For example, if you added an `<option></option>` element to body of the control in `constructor` method and you need to force the workflow designer to select one of it's options, you can check it inside this method. `validate` method has an input parameter that you can access the element body using this. After validating values, return array of error messages that you detected.
    ``` js
    validate: function(node){
                    var dom = $(node);                    
                    var errorList = [];
                    var message = $(dom.find('input[type="text"]').first()).val();
                    if(message === null || message.trim() === '')
                        errorList.push('Please enter message');
                    return errorList;
                }
    ```

- #### drawGridLines
    Default: `true`  
If you need to have grid lines in background of your designer, you can set it to `true`(or leave it as is), otherwise set it `false`.

- #### hostElement
  Default: `sequence`  
This property indicates the main element hosted in the designer. The hosted element cannot be removed in desinger.  
Available Values: 
  `sequence`
  `if`
  `while`