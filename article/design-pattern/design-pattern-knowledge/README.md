# 写《javascript的设计模式》的一些总结
最近复刻了一个[《javascript的设计模式》](https://github.com/zy445566/design-pattern-in-javascript/)。也再一次温习了js的一些看似不怎么用的知识点，但是在设计模式中又是非常重要的。对于这种容易遗忘的细节但却重要的东西，我觉得来记录这些知识点，以便需要的时候可以看看。

# 0x1 如何通过基类克隆一个子类对象
首先我们知道JS是基于设计模式中的原型模式设计原型链，那么类一定是有共通的原型在里面。那么在子类实例化之后，在基类的this也就变成了子类的this，那么只需要通过新建一个对象，并把当前子类的prototype即实例化类的__proto__重现给予到新对象中，由于this.__proto__是子类的prototype，那么绑定新对象调用子类的prototype的constructor即可实现，这也是new的过程。

但是在es6中有一些变更就是如果使用了class关键字，是不可以被call调用的，但是还是可以通过ES6推出的Reflect.construct来达到相同效果，代码如下，下面也有详细说明。
```js
// 这是基类
class Shape {
    // 代码省略...
    clone() {
        /**
        * 如果子类要改成class形式，这个方法要改写成下面形式
        * 因为主要是通过JS原型链帮助理解原型模式，所以子类不使用class形式
        * class和function构造函数的区别是class的构造函数增加了只能作为构造函数使用的校验，比如new
        * return Reflect.construct(
        * this.__proto__.constructor, 
        * [], 
        * this.__proto__.constructor
        * )
        */
       let clone = {};
       // 注意如果此类被继承，this会变成子类的方法
       // 同时这里使用的是原型的指针，所以比直接创建对象性能损耗更低
       clone.__proto__ = this.__proto__;
       this.__proto__.constructor.call(clone);
       return clone;
    }
 }
// 这是子类
function Rectangle() {
    this.type = "Rectangle";
}
Rectangle.prototype.__proto__ = new Shape();
Rectangle.prototype.draw = function() {
    console.log("I'm a rectangle")
}
```

# 0x2 如何实现一个抽象方法
设计模式中有很多抽象方法，但是抽象方法是不能被初始化，只能被继承，那么抽象类要如何实现呢？

其实有两种方法，一种是通过判断this是否instanceof这个基类，二是用ES6的方法使用new.target，如下：
```js
class AbstractLogger {
    constructor() {
        if(new.target == AbstractLogger) {
            throw new Error('this class must be extends.')
        }
    }
    // 代码省略...
}
```

# 0x3 如何实现私有变量
实现私有变量有很多方法，比如Symbol，但Symbol的实现需要通过作用域隔离，其次当访问私有属性的关键字只能返回undefined,没有错误信息抛出，这是一种非常不好的设计或实践.

那么私有属性还没有推出，如何来更好的实现呢？可以通过数据定义的方式来做这件事情，即defineProperty。

那么问题又来了，因为私有属性只允许自己调用，子类不能调用，那么如何保证是自己而不是子类或者其它类型呢？那么可以根据当前this的__proto__来判断，如果__proto__引用等于自己的prototype则为自己。因为如果是子类继承，那么this的__proto__等于继承者的prototype。那么根据这一点，我们可以这样做，如下：
```js
class Meal {
    constructor () {
        const items = [];
        /**
         * 为什么不用Proxy而使用defineProperty
         * 因为Proxy虽然实现和defineProperty类似的功能
         * 但是在这个场景下，语意上是定义属性，而不是需要代理
         */
        Reflect.defineProperty(this, 'items', {
            get:()=>{
                if(this.__proto__ != Meal.prototype) {
                    throw new Error('items is private!');
                }
                return items;
            }
        })
        
    }
    // 省略代码... 
}
```

# 0x4 如何实现类的终态方法
在设计模式中，很多方法要实现终态化，即基类的方法不能被子类覆盖。

如何做到不被子类方法覆盖父类，貌似在JS中是个难题，但真的是难题吗？

并不是，因为当子类实例化的时候需要调用父类的构造函数,但此时父类的构造函数的this就是子类的方法，而JS对象构造又是基于原型的，那么如果子类自己实现了方法，那么子类实现的方法必然不等于父类原型中的方法，通过这个方法来实现父类方法的终态化。如下：
```js
class Game {
    constructor() {
        if(this.play!= Game.prototype.play) {
            throw new Error("play mothed is final,can't be modify!");
        }
    }
    // 代码省略...
    play(){
        // 代码省略...
    }
}
```

# 结语
通过这些有意思的方法实现通过基类克隆一个子类对象,不可被初始化，私有化变量，终态方法的实现。即感叹JS的灵活性，但又对各种行为保有余地，这非常棒。同时在写[《javascript的设计模式》](https://github.com/zy445566/design-pattern-in-javascript/)的时候，发现JS本身就是一个设计模式的教科书，是很值得我们学习的。

以上例子出自于[《javascript的设计模式》](https://github.com/zy445566/design-pattern-in-javascript/)。