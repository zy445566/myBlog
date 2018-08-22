#include <stdio.h>
#include<ctype.h>
#include<string>
#include<iostream>
// clang++ -g -O3 jsvm.cpp -o jsvm && ./jsvm fibo.js
enum Token{
    tok_eof = -1,
    // define
    tok_var = -2,
    tok_func = -3,
    // code type
    tok_exp = -4,
    tok_num = -5,
    tok_unkown = -9999
};

static int gettoken(FILE *fp)
{
    static int LastChar = fgetc(fp);
    static std::string defineStr;
    // 排除空格
    while (isspace(LastChar))
    {
        LastChar = fgetc(fp);
        std::cout<<LastChar<<std::endl;
    }
    // 排除注释
    if (LastChar=='/' && (LastChar = fgetc(fp))=='/'){
        do{
            LastChar = fgetc(fp);
        } 
        while (!feof(fp) && LastChar != '\n' && LastChar != '\r' && LastChar != 10);
        // 吃掉不可见字符
        while (LastChar == '\n' || LastChar == '\r' || LastChar == 10){
            LastChar = fgetc(fp);
        }
    }
    //识别到是[a-zA-Z][a-zA-Z0-9]*
    if (isalpha(LastChar)) {
        defineStr = LastChar;
        while (isalnum((LastChar = fgetc(fp))))
        {
            defineStr += LastChar;
        }
        std::cout<<defineStr<<std::endl;
        if (defineStr == "var")
        {
            return tok_var;
        }
        if (defineStr == "function")
        {
            return tok_func;
        }
    }
    return tok_unkown;
}

int main(int argc, char* argv[])
{
    if (argc!=2)
    {
        printf("args number is error!\r\n");return -1;
    }
    FILE *fp = fopen(argv[1],"r");
    if (NULL == fp)
    {
        printf("file can't open!\r\n");return -1;
    }
    // do{
    //     int c = fgetc(fp);
    //     printf("token:%d\r\n",c);
    // }while(!feof(fp));
    int token = gettoken(fp);
    printf("token:%d\r\n",token);
    fclose(fp);
    fp = NULL;
    return 0;
}