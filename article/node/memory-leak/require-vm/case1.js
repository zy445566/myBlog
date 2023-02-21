var leakArray = [];   
exports.leak = function () {  
  leakArray.push("leak" + Math.random());  
};