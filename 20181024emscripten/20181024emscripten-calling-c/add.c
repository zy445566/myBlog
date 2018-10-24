#include <emscripten.h>
// 实现一个加法
EMSCRIPTEN_KEEPALIVE
int add(int a,int b) {
    return a+b;
}