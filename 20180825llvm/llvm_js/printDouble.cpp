// printDouble.cpp
#include <stdio.h>
// 问什么要要加extern "C" ,因为c++编译的时候会自动进行函数签名
// 如果没有extern "C" ,汇编里的方法名就会是Z11printDoubled
// 其中签名前部分由返回值和命名空间名字中间是方法名，后面是参数缩写
extern "C" {
    double printDouble(double double_num) {
        printf("double_num is: %f\r\n",double_num);
        return double_num;
    }
}