const requireVM = require('require-vm');
while(true) {
  requireVM('./case1.js').leak()
}