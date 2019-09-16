import {Action} from "redux";

export const KEY_PRESSED = "KEY_PRESSED";
export const USER_JOINED = "USER_JOINED";

export enum ActionType {
  KEY_PRESSED = "KEY_PRESSED",
  USER_JOINED = "USER_JOINED",
  USER_LEFT = "USER_LEFT"
}

export type KeyPressed = Action<ActionType.KEY_PRESSED>;
export type UserJoined = Action<ActionType.USER_JOINED>;
export type UserLeft = Action<ActionType.USER_LEFT>;

export const keyPressed = () => ({ type: ActionType.KEY_PRESSED });
export const userJoined = () => ({ type: ActionType.USER_JOINED });
export const userLeft = () => ({ type: ActionType.USER_LEFT });

export type AppAction = KeyPressed;