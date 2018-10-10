# 警惕位移运算<<的坑
在一次代码优化的过程中把
```js
// a,b都为正整数且大于0
while (a>=b) {
    a-=b;
}
```
优化为
```js
// a,b都为正整数且大于0
while (a>=b) {
    let tmpB = b;
    while (a>=tmpB) {
        let tmpShiftB = tmpB<<1;
        if (a>=tmpShiftB) {
            tmpB = tmpShiftB;
        } else {
            a-=tmpB;
        }
    }
}
```
本意是如果a很大，b很小的情况，也能把快速进行减法运算。<br />
但后来发现a一旦很大，就会死循环，这个还是概率出现。<br />
后来debug发现到一定时候tmpShiftB会变成0，导致死循环。<br />
当时就想肯定是位移符的坑，后来发现有下面几个阶段<br />
```
tmpShiftB到达1073741824后左移一位变-2147483648
结下来再由-2147483648左移一位变0
```
我一看乐了，这不是2的-32次方嘛，肯定是JS当有符号的int32型算了，然后溢出了，八成是谷歌引擎的的BUG！<br />
但想想别高兴的太早，看看标准怎么说，毕竟制定标准的人也贼坑。让我们看看标准怎么写的。<br />

[ecma-262的第9版左位移说明](http://www.ecma-international.org/ecma-262/9.0/index.html#sec-left-shift-operator)：

```
12.9.3The Left Shift Operator ( << )
NOTE
Performs a bitwise left shift operation on the left operand by the amount specified by the right operand.

12.9.3.1Runtime Semantics: Evaluation
ShiftExpression:ShiftExpression<<AdditiveExpression
Let lref be the result of evaluating ShiftExpression.
Let lval be ? GetValue(lref).
Let rref be the result of evaluating AdditiveExpression.
Let rval be ? GetValue(rref).
Let lnum be ? ToInt32(lval).
Let rnum be ? ToUint32(rval).
Let shiftCount be the result of masking out all but the least significant 5 bits of rnum, that is, compute rnum & 0x1F.
Return the result of left shifting lnum by shiftCount bits. The result is a signed 32-bit integer.
```
翻译下来大概意思是：
```
左表达式<<右表达式

左表达式结果转成Int32(有符号的int的32位类型)，结果取名lnum

右表达式结果转成Uint32(无符号的int的32未类型)，同时进行& 0x1F运算(即保留2进制的后5位，再白话一点就是保留32以内的位的数值，但和%32又有些不同)，结果取名shiftCount

最后再把lnum左位移shiftCount位，并把这个结果再转换成有符号的int的32位类型

```
一看下来坏了，果然是标准坑爹，且不说左表达式结果转成了有符号的int的32位类型，位移后的结果也给转成了有符号的int的32位类型。果然是标准坑爹。

# 结论
看来以后使用左位移符都要小心了，只适用于int32的范围(-2^32~2^32)，要是有可能超过，看来是断断不能用了。看来JS的世界精确整数也不一定就是(-2^53~2^53)范围了。
