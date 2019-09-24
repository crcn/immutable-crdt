"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEY_PRESSED = "KEY_PRESSED";
exports.USER_JOINED = "USER_JOINED";
var ActionType;
(function (ActionType) {
    ActionType["KEY_PRESSED"] = "KEY_PRESSED";
    ActionType["USER_JOINED"] = "USER_JOINED";
    ActionType["USER_LEFT"] = "USER_LEFT";
})(ActionType = exports.ActionType || (exports.ActionType = {}));
exports.keyPressed = function () { return ({ type: ActionType.KEY_PRESSED }); };
exports.userJoined = function () { return ({ type: ActionType.USER_JOINED }); };
exports.userLeft = function () { return ({ type: ActionType.USER_LEFT }); };
//# sourceMappingURL=index.js.map