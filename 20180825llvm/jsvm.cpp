#include "llvm/ADT/STLExtras.h"
#include <stdio.h>
#include<ctype.h>
#include<string>
#include<iostream>
#include "jsvm.h"
// clang++ -g -O3 jsvm.cpp  `llvm-config --cxxflags` -o jsvm && ./jsvm fibo.js
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

static double NumVal;
static int LastChar;
static std::string defineStr;
static FILE *fp;

static int gettoken()
{
    LastChar = fgetc(fp);
    // 排除不可见字符
    while (isspace(LastChar))
    {
        LastChar = fgetc(fp);
    }
    // 排除注释
    if (LastChar=='/' && (LastChar = fgetc(fp))=='/'){
        do{
            LastChar = fgetc(fp);
        } 
        while (!feof(fp) && LastChar != '\n' && LastChar != '\r' && LastChar != 10);
        // 吃掉不可见字符
        while (isspace(LastChar))
        {
            LastChar = fgetc(fp);
        }
    }
    // 解析[a-zA-Z][a-zA-Z0-9]*
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
    // 解析[0-9.]+
    if (isdigit(LastChar) || LastChar == '.') {
        std::string NumStr;
        do {
        NumStr += LastChar;
        LastChar = fgetc(fp);
        } while (isdigit(LastChar) || LastChar == '.');
        NumVal = strtod(NumStr.c_str(), nullptr);
        return tok_num;
    }
    return LastChar;
}

std::unique_ptr<ExprAST> LogError(const char *Str) {
  printf("LogError: %s\n", Str);
  return nullptr;
}
std::unique_ptr<PrototypeAST> LogErrorP(const char *Str) {
  LogError(Str);
  return nullptr;
}

static std::unique_ptr<ExprAST> ParseExpression();

static std::unique_ptr<ExprAST> ParseNumberExpr() {
  auto Result = llvm::make_unique<NumberExprAST>(NumVal);
  gettoken();
  return std::move(Result);
}

static std::unique_ptr<ExprAST> ParseParenExpr() {
  gettoken(); // eat (.
  auto V = ParseExpression();
  if (!V) {
      return nullptr;
  }
  if (LastChar != ')') {
      return LogError("expected ')'");
  }
  gettoken(); // eat ).
  return V;
}

int main(int argc, char* argv[])
{
    if (argc!=2)
    {
        printf("args number is error!\r\n");return -1;
    }
    fp = fopen(argv[1],"r");
    if (NULL == fp)
    {
        printf("file can't open!\r\n");return -1;
    }
    int token = gettoken();
    printf("token:%d\r\n",token);
    fclose(fp);
    fp = NULL;
    return 0;
}