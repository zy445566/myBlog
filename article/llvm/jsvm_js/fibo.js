// fibo.js 这是斐波纳切数
function fibo(num) {
    if (num<=2) {return 1;}
    return fibo(num-1)+fibo(num-2);
}

function main()
{
    return printDouble(fibo(9));
}