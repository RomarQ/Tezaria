import { ControllerActionTypes, ControllerActions } from '../actions/bakingController';
import { BakingControllerState  } from '../utils/padaria/types';

const defaultState = {
  active: false,
  baking: false,
  endorsing: false,
  accusing: false
}

export default (state: BakingControllerState = defaultState, action: ControllerActions) => {
  switch (action.type) {
    case ControllerActionTypes.START:
      return {
        active: action.options.baking || action.options.endorsing || action.options.accusing,
        ...action.options
      };
      case ControllerActionTypes.STOP:
      return defaultState;
    default:
      return state;
  }
}
