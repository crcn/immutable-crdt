import { AppAction } from "../actions";
import { App } from "../states";


const INITIAL_STATE: App = {};

export const mainReducer = (action: AppAction, state: App = INITIAL_STATE) => {
  return state;
}