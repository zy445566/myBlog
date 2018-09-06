const llvm  = require('llvm-node');
const the_context = new llvm.LLVMContext();
const the_module = new llvm.Module("jsvm", the_context);
const builder = new llvm.IRBuilder(the_context);
let variable_map = {};
let the_function;


module.exports = class JSVM{
    constructor(js_ast) {
        this.js_ast = js_ast;
    }

    programHandler(node) {
        for(let i=0;i<node.body.length;i++)
        {
            this.handler(node.body[i]);
        }
    }

    functionHandler(node) {
        let func_name = node.id.name;
        the_function = the_module.getFunction(func_name);
        if (the_function) {
           throw new Error('function is exist');
        }
        let double_type = llvm.Type.getDoubleTy(the_context);
        let params_list = [];
        for(let i=0;i<node.params.length;i++)
        {
            params_list.push(double_type);
        }
        let the_function_type = llvm.FunctionType.get(
            double_type,params_list,false
        );
        the_function = llvm.Function.create(
            the_function_type,
            llvm.LinkageTypes.ExternalLinkage,
            func_name,the_module
        );
        let the_args = the_function.getArguments();
        for(let i=0;i<the_args.length;i++)
        {
            the_args[i].name=node.params[i].name;
        }
        let basic_block = llvm.BasicBlock.create(the_context,"entry",the_function);
        builder.setInsertionPoint(basic_block);
        
        variable_map = {};
        for(let i=0;i<the_args.length;i++)
        {
            variable_map[the_args[i].name]=the_args[i];
        }

        if (node.body.type!='BlockStatement')
        {
            throw new Error('function body only support BlockStatement');
        }
        this.blockHandler(node.body);

        
    }

    blockHandler(node)
    {
        let expr_list = [];
        for(let i=0;i<node.body.length;i++)
        {
            expr_list.push(this.handler(node.body[i]));
        }
        return expr_list;
    }

    ifHandler(node) {
        if (node.test.type!='BinaryExpression') {
            throw new Error('if conds only support binary expression');
        }
        let cond = this.binaryHandler(node.test);
        let zero = llvm.ConstantFP.get(the_context,0);
        let cond_v = builder.createFCmpONE(cond,zero,"ifcond");
        let then_bb = llvm.BasicBlock.create(the_context,"then",the_function);
        let else_bb = llvm.BasicBlock.create(the_context,"else",the_function);
        builder.createCondBr(cond_v,then_bb,else_bb);
        builder.setInsertionPoint(then_bb);
        if (!node.consequent) {throw new Error('then not extist');}
        if (node.consequent.type!='BlockStatement')
        {
            throw new Error('then body only support BlockStatement');
        }
        this.blockHandler(node.consequent);
        builder.setInsertionPoint(else_bb);
        if (node.alternate) {
            if (node.alternate.type!='BlockStatement')
            {
                throw new Error('else body only support BlockStatement');
            }
            this.blockHandler(node.alternate);
        }
    }

    binaryHandler(node) {
        let left = this.handler(node.left,node);
        let right = this.handler(node.right,node);
        if (!left) {
            throw new Error('binary expression make left error')
        }
        if (!right) {
            throw new Error('binary expression make right error')
        }
        switch(node.operator) {
            case '+':
                return builder.createFAdd(left, right, 'addtmp');
            case '-':
                return builder.createFSub(left, right, 'subtmp');
            case '*':
                return builder.createFMul(left, right, 'multmp');
            case '/':
                return builder.createFDiv(left, right, 'divtmp');
            case '<':
                left = builder.createFCmpULT(left, right, "cmpulttmp");
                return builder.createUIToFP(left, llvm.Type.getDoubleTy(the_context), "booltmp");
            case '<=':
                left = builder.createFCmpULE(left, right, "cmpuletmp");
                return builder.createUIToFP(left, llvm.Type.getDoubleTy(the_context), "booltmp");
            case '>':
                left = builder.createFCmpUGT(left, right, "cmpugttmp");
                return builder.createUIToFP(left, llvm.Type.getDoubleTy(the_context), "booltmp");
            case '>=':
                left = builder.createFCmpUGE(left, right, "cmpugetmp");
                return builder.createUIToFP(left, llvm.Type.getDoubleTy(the_context), "booltmp");
            default:
                throw new Error("invalid binary operator");
        }
    }

    returnHandler(node) {
        let ret = builder.createRet(this.handler(node.argument));
        return ret;
    }

    identifierHandler(node,parent_node) {
        switch (parent_node.type) {
            case 'BinaryExpression':
                if(!variable_map[node.name]) {
                    throw new Error('variable not exist');
                }
                return variable_map[node.name];
            default:
                throw new Error('unkown identifier');
        }
        
    }

    numberHandler(node) {
        return llvm.ConstantFP.get(the_context,node.value);
    }

    handler(node,parent_node = null) {
        switch(node.type) {
            case 'Program':
                return this.programHandler(node);
            case 'FunctionDeclaration':
                return this.functionHandler(node);
            case 'BlockStatement':
                return this.blockHandler(node);
            case 'IfStatement':
                return this.ifHandler(node);
            case 'BinaryExpression':
                return this.binaryHandler(node);
            case 'ReturnStatement':
                return this.returnHandler(node);
            case 'Identifier':
                return this.identifierHandler(node,parent_node);
            case 'NumericLiteral':
                return this.numberHandler(node);
            default:
                throw new Error('not support grammar type');
        }
    }
    gen() {
        this.handler(this.js_ast.program);
    }
    print() {
        return the_module.print();
    }
    write(bit_code_path) {
        llvm.writeBitcodeToFile(the_module, bit_code_path);
    }
}