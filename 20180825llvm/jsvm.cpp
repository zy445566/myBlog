#include "llvm/ADT/STLExtras.h"
#include <stdio.h>
#include<ctype.h>
#include<string>
#include<iostream>
#include<map>
#include "jsvm.h"
// clang++ -g -O3 jsvm.cpp  `llvm-config --cxxflags` -o jsvm && ./jsvm fibo.js
enum Token{
    tok_eof = -1,
    // define
    tok_var = -2,
    tok_func = -3,
    // code type
    tok_id = -4,
    tok_exp = -5,
    tok_num = -6,
    tok_unkown = -9999
};

static double NumVal;
static int LastChar;
static std::string defineStr;
static FILE *fp;
static std::map<char, int> BinOp;
static std::unique_ptr<ExprAST> ParseExpression();


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
        return tok_id;
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
    if(feof(fp)){
        return tok_eof;
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

static std::unique_ptr<ExprAST> ParseIdentifierExpr() {
  std::string IdName = defineStr;
  gettoken(); // eat identifier.
  if (LastChar != '(') // Simple variable ref.
    return llvm::make_unique<VariableExprAST>(IdName);
  gettoken(); // eat (
  std::vector<std::unique_ptr<ExprAST>> Args;
  if (LastChar != ')') {
    while (true) {
      if (auto Arg = ParseExpression())
        Args.push_back(std::move(Arg));
      else
        return nullptr;

      if (LastChar == ')')
        break;

      if (LastChar != ',')
        return LogError("Expected ')' or ',' in argument list");
      gettoken();
    }
  }

  gettoken();

  return llvm::make_unique<CallExprAST>(IdName, std::move(Args));
}

static std::unique_ptr<ExprAST> ParseNumberExpr() {
  auto Result = llvm::make_unique<NumberExprAST>(NumVal);
  gettoken(); // consume the number
  return std::move(Result);
}

static std::unique_ptr<ExprAST> ParseParenExpr() {
  gettoken(); // eat (.
  auto V = ParseExpression();
  if (!V)
    return nullptr;

  if (LastChar != ')')
    return LogError("expected ')'");
  gettoken(); // eat ).
  return V;
}

static std::unique_ptr<ExprAST> ParsePrimary() {
  switch (LastChar) {
  default:
    return LogError("unknown token when expecting an expression");
  case tok_id:
    return ParseIdentifierExpr();
  case tok_num:
    return ParseNumberExpr();
  case '(':
    return ParseParenExpr();
  }
}

static int GetTokPrecedence() {
  if (!isascii(LastChar))
    return -1;

  // Make sure it's a declared binop.
  int TokPrec = BinOp[LastChar];
  if (TokPrec <= 0)
    return -1;
  return TokPrec;
}

static std::unique_ptr<ExprAST> ParseBinOpRHS(
    int ExprPrec,
    std::unique_ptr<ExprAST> LHS
) {
  while (true) {
    int TokPrec = GetTokPrecedence();

    if (TokPrec < ExprPrec){return LHS;}
    int BinOp = LastChar;
    gettoken(); // eat binop
    auto RHS = ParsePrimary();
    if (!RHS)
      return nullptr;

    int NextPrec = GetTokPrecedence();
    if (TokPrec < NextPrec) {
      RHS = ParseBinOpRHS(TokPrec + 1, std::move(RHS));
      if (!RHS)
        return nullptr;
    }
    // Merge LHS/RHS.
    LHS = llvm::make_unique<BinaryExprAST>(BinOp, std::move(LHS),
                                           std::move(RHS));
  }
}

static std::unique_ptr<ExprAST> ParseExpression() {
  auto LHS = ParsePrimary();
  if (!LHS)
    return nullptr;

  return ParseBinOpRHS(0, std::move(LHS));
}

static std::unique_ptr<PrototypeAST> ParsePrototype() {
    if (LastChar != tok_id)
        return LogErrorP("Expected function name in prototype");

    std::string FnName = defineStr;
    gettoken();
    if (LastChar != '(')
        return LogErrorP("Expected '(' in prototype");

    std::vector<std::string> ArgNames;
    while (gettoken() == tok_id)
        ArgNames.push_back(defineStr);
    if (LastChar != ')')
        return LogErrorP("Expected ')' in prototype");
    gettoken();
    return llvm::make_unique<PrototypeAST>(FnName, std::move(ArgNames));
}

static std::unique_ptr<FunctionAST> HandleFunction() {
    LastChar = gettoken();
    auto Proto = ParsePrototype();
    if (!Proto){return nullptr;}
    if (auto E = ParseExpression())
    {
        return llvm::make_unique<FunctionAST>(std::move(Proto), std::move(E));
    }
    gettoken();
    return nullptr;
}

static void LoopParse() {
    LastChar = gettoken();
    while (true) {
        switch (LastChar) {
        case tok_eof:
            return;
        case ';': // ignore top-level semicolons.
            gettoken();
            break;
        case tok_func:
            HandleFunction();
            printf("%d\n",LastChar);
            printf("%c\n",LastChar);
            break;
        default:

            break;
        }
    }
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
    BinOp['<'] = 10;
    BinOp['+'] = 20;
    BinOp['-'] = 20;
    BinOp['*'] = 40;
    LoopParse();
    fclose(fp);
    fp = NULL;
    return 0;
}