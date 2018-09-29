## Setup

### Minimum requirements
To get started, you have to import at least 7 libraries in your page
1. JQeury library  
 Base JQuery library
``` html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
```
2. JQuery UI  
 To add some abilities such as Drag and Drop to our designer
``` html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js"></script>
```
3. Bootstrap  
Portia Workflow uses bootstrap for it's UI. It is compatible with both of the version 3.0 and 4.0. So you need to import one of them in your page.
``` html
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>
```
4. Font-Awesome  
To have a light weight plugin, Portia Workflow uses font-awesome for it's icons
``` html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
```
5. jquery-confirm  
In some cases like removing an activity, Portia Workflow uses this plugin to show a confirmation or alert dialog. This plugin will remove in future.
``` html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-confirm/3.3.2/jquery-confirm.min.js"></script>
```
6. JQuery UI Touch Punch  
 If you want to use Drop and Drop functionality in your touch screen devices, you should add this library
``` html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js"></script>
```
And Finally
7. Portia Sequence flow designer
``` html
<link rel="stylesheet" href="designer/sequence/css/sequence.css">
<script src="designer/sequence/js/sequence.js"></script>
```

### Setting Up

The only thing you need to do is calling **seqDesigner** for your DOM element.
``` html
<div id="designer">
</div>
<Script>
    $(document).ready(function(){
        $('#designer').seqDesigner();
    });
</script>
```