Pipeline.js
===========

Pipeline-js enables easy setup of complex async queues in javascript.
It is implemented in pure javascript (meaning it can be used in popular
frameworks such as jQuery or MooTools) and should work in most browsers as well
as in node.js (has not been extensively tested in either).

How to Use
----------

The easiest way to see what Pipeline-js supports is to look at the source, or
the supplied unittests availible. The unit-tests should provide a simple way to
see all the functionallity there is, however I will try to highlight the main
(and most of) the features here.

The way to construct a pipeline is by using the `Pipeline`-function, and adding
"pipes" to it, then calling the `create` function on the Pipeline-builder.

An example of a pipeline used for saving and updating could for instance look
like this:

```javascript
var saveAndUpdate = Pipeline().start(function() {
    showSavingDiv();
}).pipeAsync(function(state, cb) {
    sendXhr('/save', state.data, function(result) {
        state.result = result;
        cb();
    });
}).pipe(function(state) {
    var result = state.result;
    if(result.updateGui) {
        update(state.id, result);
    }
}).stop(function() {
    hideSavingDiv();
}).create();

function myButton1OnClick() {
    var data = getFormData(this);
    var id = getId(this);
    saveAndUpdate({id: id, data: data});
}
```

There are 3 main functions on the Pipeline-builder, these are:

*   `Builder start[Async](Function fn)`: Add a startup-action (only called when the pipeline goes from doing nothing to doing something.
*   `Builder stop[Async](Function fn)`: Add a stop-action (only called when the pipeline is done with it's entire queue, and goes to sleep.
*   `Builder pipe[Async](Function fn)`: Add a pipe to the pipeline. Pipes are (like start and stop actions) called in turn, but they are called in turn for each item submitted into the pipeline.
*   `Pipeline create()`: Creates a pipeline from the builder. The builder cannot be used more after this. Use the Pipeline as a function to commit new items.


The Pipeline has 2 functions:

*   `Undefined once(Function fn)`: Runs the function fn either immediately, or the first time the pipeline is empty (after the stop-calls has been made).
*   `Number backlog()`: Returns the number of items in the backlog (queue) of the pipeline. This does not include the ellement currently in the "pipes".