//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/access/AccessControlDefaultAdminRules.sol";

contract ElepToken is ERC20PresetMinterPauser {
    constructor() ERC20PresetMinterPauser("ElepToken", "ELP") {}
}
