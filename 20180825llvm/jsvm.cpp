#include "jsvm.h"

// clang++ -g -O3 jsvm.cpp  `llvm-config --cxxflags --ldflags --system-libs --libs all` -o jsvm
// ./jsvm fibo.js && clang++ main.cpp fibo.js.o -o main && ./main

static double NumVal;
static int LastChar;
static std::string defineStr;
static FILE *fp;
static std::map<char, int> BinOp;
static std::unique_ptr<ExprAST> ParseExpression();
static std::unique_ptr<ExprAST> HandleIf();

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
            if (LastChar=='/') {fseek(fp,-1L,SEEK_CUR);}
        }
    }
    // 解析[a-zA-Z][a-zA-Z0-9]*
    if (isalpha(LastChar)) {
        defineStr = LastChar;
        int TmpChar;
        while (isalnum((TmpChar = fgetc(fp))) && (LastChar = TmpChar))
        {
            defineStr += TmpChar;
        }
        fseek(fp,-1L,SEEK_CUR);
        if (defineStr == "var")
        {
            return tok_var;
        }
        if (defineStr == "function")
        {
            return tok_func;
        }
        if (defineStr == "if")
        {
            return tok_if;
        }
        if (defineStr == "else")
        {
            return tok_else;
        }
        if (defineStr == "return")
        {
            return tok_return;
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

static std::unique_ptr<ExprAST> ParseIdentifierExpr() {
    std::string IdName = defineStr;
    gettoken();
    if (LastChar != '('){
        fseek(fp,-1L,SEEK_CUR);
        return llvm::make_unique<VariableExprAST>(IdName);
    }
    std::vector<std::unique_ptr<ExprAST>> Args;
    while (true) {
        if (auto Arg = ParseExpression()){
            Args.push_back(std::move(Arg));
        } else {
            return nullptr;
        }
        if (LastChar == ')'){break;}
            
        if (LastChar != ','){return LogError("Expected ')' or ',' in argument list");}
        gettoken();
    }
    return llvm::make_unique<CallExprAST>(IdName, std::move(Args));
}

static std::unique_ptr<ExprAST> ParseNumberExpr() {
  auto Result = llvm::make_unique<NumberExprAST>(NumVal);
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

static int RowToken = 0;
static std::unique_ptr<ExprAST> ParsePrimary() {
  int res = gettoken();
  switch (res) {
  default:
    return LogError("unknown token when expecting an expression");
  case tok_id:
    return ParseIdentifierExpr();
  case tok_if:
    return HandleIf();
  case tok_num:
    return ParseNumberExpr();
  case tok_return:
    RowToken = tok_return;
    return ParsePrimary();
  case '}':
    return nullptr;
  case ';':
    return nullptr;
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
  gettoken();
  while (true) {
    int TokPrec = GetTokPrecedence();
    if (TokPrec < ExprPrec){return LHS;}
    int BinOp = LastChar;
    auto RHS = ParsePrimary();
    if (!RHS){return nullptr;}
    int NextPrec = GetTokPrecedence();
    if (TokPrec < NextPrec) {
      RHS = ParseBinOpRHS(TokPrec + 1, std::move(RHS));
      if (!RHS){return nullptr;}
    }
    // Merge LHS/RHS.
    LHS = llvm::make_unique<BinaryExprAST>(BinOp, std::move(LHS),
                                           std::move(RHS));
    // return nullptr;
  }
}

static std::unique_ptr<ExprAST> ParseExpression() {
    auto LHS = ParsePrimary();
    if (!LHS){
        return nullptr;
    }
    return ParseBinOpRHS(0, std::move(LHS));
}

static std::unique_ptr<PrototypeAST> ParsePrototype() {
    if (LastChar != tok_id){return LogErrorP("Expected function name in prototype");}

    std::string FnName = defineStr;
    gettoken();
    if (LastChar != '('){return LogErrorP("Expected '(' in prototype");}
    std::vector<std::string> ArgNames;
    while (gettoken() == tok_id || LastChar==',')
    {
        if(LastChar==','){continue;}
        ArgNames.push_back(defineStr);
    }
    if (LastChar != ')'){return LogErrorP("Expected ')' in prototype");}
    return llvm::make_unique<PrototypeAST>(FnName, std::move(ArgNames));
}

static std::unique_ptr<FunctionAST> HandleFunction() {
    LastChar = gettoken();
    auto Proto = ParsePrototype();
    if (!Proto){return nullptr;}
    gettoken();
    if (LastChar != '{'){return LogErrorF("Expected '{' in prototype");}
    std::vector<FnucBody> FnBody;
    while(true){
        FnucBody fnRow;
        if (auto E = ParseExpression())
        {
            fnRow.expr_row = std::move(E);
            fnRow.tok = RowToken;
            RowToken = 0;
            FnBody.push_back(std::move(fnRow));
        } else {
            if (LastChar == ';'){continue;}
            if (LastChar != '}'){return LogErrorF("Expected '}' in prototype");}
            auto FnAST = llvm::make_unique<FunctionAST>(std::move(Proto), std::move(FnBody));
            if (auto *FnIR = FnAST->codegen()) {
                FnIR->print(llvm::errs());
            }
            return FnAST;
        }
    }
    return nullptr;
}

static std::unique_ptr<ExprAST> HandleIf() {
    gettoken();
    if (LastChar != '('){return LogError("If Expected '(' in prototype");}
    // condition.
    auto Cond = ParseExpression();
    if (!Cond){return nullptr;}
    if (LastChar != ')'){return LogError("If Expected ')' in prototype");}
    gettoken();
    if (LastChar != '{'){return LogError("If Expected '{' in prototype");}
    auto Then = ParseExpression();
    if (!Then){return nullptr;}
    if (LastChar != '}'){return LogError("If Expected '}' in prototype");}
    if (gettoken() != tok_else)
        return LogError("expected else");
    gettoken();
    if (LastChar != '{'){return LogError("Else Expected '{' in prototype");}
    auto Else = ParseExpression();
    if (LastChar ==')') {gettoken();}
    if (LastChar ==';') {gettoken();}
    if (LastChar != '}'){return LogError("Else Expected '}' in prototype");}
    if (!Else){return nullptr;}
    fseek(fp,-1L,SEEK_CUR);
    return llvm::make_unique<IfExprAST>(std::move(Cond), std::move(Then),
                                        std::move(Else));
}

static void LoopParse() {
    while (true) {
        LastChar = gettoken();
        switch (LastChar) {
        case tok_eof:
            return;
        case ';': // ignore top-level semicolons.
            gettoken();
            break;
        case tok_func:
            HandleFunction();
            break;
        case tok_if:
            HandleIf();
            break;
        default:
            break;
        }
    }
}

int destFile (std::string FileOrgin) {
  llvm::InitializeAllTargetInfos();
  llvm::InitializeAllTargets();
  llvm::InitializeAllTargetMCs();
  llvm::InitializeAllAsmParsers();
  llvm::InitializeAllAsmPrinters();

  auto TargetTriple = llvm::sys::getDefaultTargetTriple();
  TheModule->setTargetTriple(TargetTriple);

  std::string Error;
  auto Target = llvm::TargetRegistry::lookupTarget(TargetTriple, Error);

  // Print an error and exit if we couldn't find the requested target.
  // This generally occurs if we've forgotten to initialise the
  // TargetRegistry or we have a bogus target triple.
  if (!Target) {
    llvm::errs() << Error;
    return 1;
  }

  auto CPU = "generic";
  auto Features = "";

  llvm::TargetOptions opt;
  auto RM = llvm::Optional<llvm::Reloc::Model>();
  auto TheTargetMachine =
      Target->createTargetMachine(TargetTriple, CPU, Features, opt, RM);

  TheModule->setDataLayout(TheTargetMachine->createDataLayout());

  std::string  Filename = FileOrgin+".o";
  std::error_code EC;
  llvm::raw_fd_ostream dest(Filename, EC, llvm::sys::fs::F_None);

  if (EC) {
    llvm::errs() << "Could not open file: " << EC.message();
    return 1;
  }

  llvm::legacy::PassManager pass;
  auto FileType = llvm::TargetMachine::CGFT_ObjectFile;

  if (TheTargetMachine->addPassesToEmitFile(pass, dest, FileType)) {
    llvm::errs() << "TheTargetMachine can't emit a file of this type";
    return 1;
  }

  pass.run(*TheModule);
  dest.flush();

  llvm::outs() << "Wrote " << Filename << "\n";
  return 0;
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
    TheModule = llvm::make_unique<llvm::Module>("my js jit", TheContext);
    LoopParse();
    TheModule->print(llvm::errs(), nullptr);
    destFile(argv[1]);
    fclose(fp);
    fp = NULL;
    return 0;
}