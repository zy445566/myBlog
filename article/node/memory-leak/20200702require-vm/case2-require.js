function getN (n) {
  return n;
};
let memoize = require('lodash').memoize
let memoizeGetN = memoize(getN);
let i=0n;
while(true) {
  memoizeGetN(i);
  i++;
}