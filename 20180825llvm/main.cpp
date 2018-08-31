// main.cpp
#include <iostream>

extern "C" {
    double fibo(double);
}

int main() {
    std::cout << "fibo(9) is: " << fibo(9) << std::endl;
}