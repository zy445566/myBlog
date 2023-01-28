// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
interface IERC20 {
    // token名字
    function name() external view returns (string memory);
    // token唯一标识，用于发放代币
    function symbol() external view returns (string memory);
    // token额度最小单位是小数点的后多少位，类似Ether的个和Wei或BTC的个和聪的关系
    function decimals() external view returns (uint8);
    // 交易事件
    event Transfer(address indexed from, address indexed to, uint256 value);
    // 赋予事件
    event Approval(address indexed owner, address indexed spender, uint256 value);
    // token总量查询
    function totalSupply() external view returns (uint256);
    // 某个账户token余额查询
    function balanceOf(address account) external view returns (uint256);
    // 从当前账户转账，结束后需要调用Transfer事件
    function transfer(address to, uint256 amount) external returns (bool);
    // 获取toekn授权量
    function allowance(address owner, address spender) external view returns (uint256);
    // 将自己的token授权给某个账户一定的量，结束后需要调用Approval事件,一般用于委托转帐
    function approve(address spender, uint256 amount) external returns (bool);
    // 传入指定从某个账户转账到另一个账户，一般用于委托转帐调用，由调用方消耗Gas
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

// 完整合约代码，可以在 https://github.com/zy445566 查看

contract Coin is IERC20 {
    // 这个是用来铸币用的，我要给我自己发币可以使用这个
    address public minter;
    // 币的名称
    string private _name;
    // 币的标识
    string private _symbol;
    // 币的精度
    uint8 private _decimals;
    // 币的总量
    uint256 private _totalSupply;
    // 这个map类型，用于地址映射代币数量
    mapping (address => uint256) private _balances;
    // 这个是map嵌套类型，用于映射某个账户和另一个账户是否存在授权转账，一般用于代转账
    mapping(address => mapping(address => uint256)) private _allowances;

    // 初始化方法
    constructor(string memory nameValue, string memory symbolValue, uint8 decimalsValue) {
        // 把合约创建者变成铸币人
        minter = msg.sender;
        // 确定币的名字
        _name = nameValue;
        // 确定币的标识，有点类似于股票发行代码
        _symbol = symbolValue;
        // 确定最小单位与个的精度
        _decimals = decimalsValue;
        // 初始供应链为0
        _totalSupply = 0;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }
    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    // 铸币方法
    function mint(address receiver, uint256 amount) public {
        require(msg.sender == minter, "ERC20:You aren't the owner");
        _balances[receiver] += amount;
    }

    // 交易方法
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        // 校验钱是否足够
        require(amount <= _balances[msg.sender], "ERC20:Insufficient balance.");
        require(amount > 0, "ERC20:Amount has to be greater than 0.");
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        require(amount <= _balances[msg.sender], "ERC20:Insufficient balance to approve.");
        require(amount > 0, "ERC20:Amount has to be greater than 0.");
        _balances[msg.sender] -= amount;
        _allowances[msg.sender][spender]+= amount;
        emit Approval(msg.sender, spender, _allowances[msg.sender][spender]);
        return true;
    }
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        require(amount <= _allowances[from][to], "ERC20:Insufficient allowance.");
        _allowances[from][to] -= amount;
        emit Approval(from, to, _allowances[from][to]);
        _balances[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}