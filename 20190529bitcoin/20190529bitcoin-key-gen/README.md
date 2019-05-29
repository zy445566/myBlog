# Bitcoin公私钥是如何生成的
原本一直都是靠比特币钱包生成公私钥的，但感觉一直不是很放心，尤其是npm包隐藏盗币代码后，一直感觉危险重重，加上货币交易所，也是存在倒闭或跑路的风险，毕竟是第三方。加之又看到node12支持了原生的BigInt，想着是时候自己做个无第三方依赖的公私钥生成工具了。

# 先谈私钥生成
私钥是如何产生的呢？简单来说就是在一个大数中选值，最后进行按照一些规则加密成我们所使用的私钥。我这边使用了两种方法实现，一个是随机法，一个是加密法生成。

## 先看加密生成法
```js
// 简易sha256通过字符串生成摘要
function getPrivteOriginKeyByStr(strSeed) {
    return crypto.createHash('sha256').update(strSeed).digest('hex');
}
```
这里就是直接使用sha256生成摘要，然后生成一个十六进制的私钥原值

## 再随机生成法
```js
const n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
function getPrivteOriginKeyByRand() {
    let nHex = n.toString(16);
    let privteKeyList = [];
    let isZero = true;
    for(let i=0;i<nHex.length;i++) {
        let rand16Num = Math.round(Math.random()*parseInt(nHex[i],16));
        privteKeyList.push(rand16Num.toString(16));
        if(rand16Num>0) {isZero = false;}
    }
    if(isZero){getPrivteOriginKeyByRand();}
    return privteKeyList.join('');
}
```
这里就是通过通过每位进行随机，再组合生成一个长串，目前node的随机数种子在linux中会取一个文件的指纹（这个文件是会不断变化的，以前看过代码，现在有点忘记叫什么文件了），所以你不用当心第一次生成都会是一样的值。

## 第二步就是将原值转换成我们能导入钱包的私钥
转换规则是原值加上版本做前缀，进行两次sha256加密，同时取前4个字节，进行58进制转换。如下。
```js
function hex2sha256(hexStr) {
    return crypto.createHash('sha256').update(Buffer.alloc(hexStr.length/2,hexStr, 'hex')).digest('hex');
}

function getPrivteKeyByOrigin(privteKeyOrigin) {
    if(privteKeyOrigin.length!==64){
        throw new Error('privte Key Origin length must be 64!')
    }
    let version = '80';
    let sha1Str = `${version}${privteKeyOrigin}`;
    let sha1 =  hex2sha256(sha1Str);
    let sha2Str = `${sha1}`;
    let sha2 =  hex2sha256(sha2Str);
    let key = `${version}${privteKeyOrigin}${sha2.slice(0,8)}`;
    return util.hex2Base58(key);
}
```
这里你可能会有几个疑问：
* 为什么hexStr.length要除以2？
    * 因为一个字节是255，两个十六进制数才构成一个字节，所以需要除2,同时如直接使用文本则会直接已默认utf8的对象传入一个十六进制字符占一字节导致计算不准确。
* 那之前说好前4个字节，为什么要sha2.slice(0,8)？
    * 和上面一样sha2是16进制数，4字节就是十六进制数的8位。
* 58进制是什么鬼？
    * 58进制其实就是数字和大小写字母中剔除了大写i,大写o，小写L,数字0，因为这些无论是被当作地址还是作为私钥都容易被人混淆，所以去除了。数字加大小写共62位，减去4位则为58位。

# 再谈公钥生成
## 第一步公钥的原值
公钥原值生成其实是采用了椭圆加密算法，简单来说就是使用了E : y^2 ≡ x^3 + ax + b (mod p)算法实现椭圆曲线，然后使用K=kG,计算公钥，小k是私钥，大K我们要求的公钥，G是椭圆曲线上的一个点，这是一个常量。

注意的点是kG并不是代表k和G点的乘基，而是又前一个点推导到后一个点。

可以用如下公司求解(其中a,p都是常量)：
```
相同的点相加第一式: λ≡(3x1^2+ a)/2y1(mod p)
相同的点相加第二式: x3 ≡ λ^2 − 2x1 (mod p), y3≡ λ(x1 − x3) − y1 (mod p)

不同的点相加第一式: λ≡ （y2 − y1）/（x2 − x1）(mod p)
不同的点相加第二式: x3 ≡ λ^2 − x1 − x2 (mod p), y3 ≡ λ(x1 − x3) − y1 (mod p)
```
第一步：比如G点的x,y坐标是x1,y1,那么这时我需要求解2G，那么先用G导入“相同的点相加第一式”，求出λ，然后“相同的点相加第二式”求解x3,y3，这个点就是2G了。

第二步：现在有G和2G两个点，那么3G的求解则是将2G带入“不同的点相加第一式”去减G，求出λ，然后再用“不同的点相加第二式”求解x3,y3，这个点就是3G了。

然后4G,5G,6G...kG可以不断使用第二步循环执行来得出。

目前本人正在写这部分的原生纯算法实现，但是目前生成公钥因为不需要签名所以，我直接用了node的ECDH库，因为ECDH和ECDSA仅仅是椭圆加密算法的不同实现，所以生成公钥可以直接使用。如下。

```js
function getPublicOriginKey(privteKeyOrigin) {
    if(privteKeyOrigin.length!==64){
        throw new Error('privte Key Origin length must be 64!')
    }
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(privteKeyOrigin,'hex');
    return ecdh.getPublicKey('hex');
}
```

## 第二步公钥原值生成公钥地址
这里其实就是将公钥原值，先进行一次hex2sha256运算，然后使用再ripemd160加密上一步结果，将结果增加主网号00后再进行两次加密，取ripemd160加密结果和上一次结果的前四个字节，组成key走一个转58进制，加地址标示1，生成公钥地址。如下。
```js
function getPublicKeyByOrigin(publicKeyOrigin) {
    let mainVersionHex = '00';
    let addreeSign = '1';
    let sha1 = hex2sha256(publicKeyOrigin);
    let ripemd160Hex =  crypto.createHash('ripemd160').update(Buffer.alloc(sha1.length/2,sha1, 'hex')).digest('hex');
    let ripemd160HexUsed =`${mainVersionHex}${ripemd160Hex}`;
    let sha2 =  hex2sha256(ripemd160HexUsed);
    let sha3 =  hex2sha256(sha2);
    let key = `${ripemd160HexUsed}${sha3.slice(0,8)}`;
    return `${addreeSign}${util.hex2Base58(key)}`;
}
```
生成公钥地址可以说是不可逆的，首先用椭圆加密算法将私钥进行了数学难题加密，再通过摘要算法，只获取摘要信息，所以简单来说这个公钥地址也仅仅是原值的摘要而已，连要复原公钥原值都不太可能。

# 附文
欢迎大家使用 [bitcoin-key-generator(代码点此)](https://github.com/zy445566/bitcoin-key-generator)来生成私钥,代码不多，无第三方库，可以看后再生成保证自己私钥安全。最后希望大家能推荐我一个杭州仓前不加班955的坑，工资可谈。