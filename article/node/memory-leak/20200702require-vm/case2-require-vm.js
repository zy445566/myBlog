const requireVM = require('require-vm');
function getN (n) {
  return n;
};
let memoize = requireVM('lodash').memoize
let memoizeGetN = memoize(getN);
let i=0n;
while(true) {
  memoizeGetN(i);
  /**
   * 当重新赋值后原memo的引用也会被丢弃
   * 如果完全不需要可delete memoizeGetN
   * 但这样做原本用于缓存计算结果也无效了
   */
  memoizeGetN = memoize(getN);
  i++;
}