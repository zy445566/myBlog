let addModule = require('./add.js');
// let add = addModule.cwrap('add', 'number', ['number','number']);
addModule.onRuntimeInitialized = function() {
    // console.log(add(1,2))
    // console.log(addModule.ccall('add', 'number', ['number','number'], [3,4]));
    console.log(addModule._add(5,6))
}