// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./openzeppelin/IERC20.sol";
import "./openzeppelin/IERC20Metadata.sol";

contract PracticeERC20 is IERC20, IERC20Metadata {
    // ブロックチェーン上に永続的に保存される（状態変数；state variable）
    string private _name; //""
    string private _symbol;
    uint8 private _decimals; //0
    uint256 private _totalSupply; // 0
    mapping(address => uint256) _balances;
    mapping(address => mapping(address => uint256)) _allowance;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_
    ) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _totalSupply = totalSupply_;
        _balances[msg.sender] = totalSupply_;
    }

    // IERC20Metadata
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

    function balanceOf(
        address account
    ) public view virtual override returns (uint256) {
        return _balances[account];
    }

    function transfer(
        address to,
        uint256 amount
    ) public override returns (bool) {
        // tip: この関数を実行するアカウントのアドレスはmsg.senderで取得できる
        require(_balances[msg.sender] >= amount, "No sufficient balance");
        _balances[msg.sender] = _balances[msg.sender] - amount;
        _balances[to] = _balances[to] + amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override returns (bool) {
        require(_allowance[msg.sender][from] >= amount, "Low allowance");
        // fromのbalancesにamount以上の預金があることをcheck
        require(_balances[from] >= amount, "No effcient balance");
        // 1. fromのアドレスからamountを引く
        _balances[from] = _balances[from] - amount;
        // 2. toのアドレスにamountを足す
        _balances[to] = _balances[to] + amount;
        // 3. Transfer event を emitする
        emit Transfer(from, to, amount);
        return true;
    }

    function allowance(
        address owner,
        address spender
    ) public view virtual override returns (uint256) {
        return _allowance[owner][spender];
    }

    function approve(
        address spender,
        uint256 amount
    ) public override returns (bool) {
        _allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
}
