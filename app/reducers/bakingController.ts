import { ControllerActionTypes, ControllerActions } from '../actions/bakingController';

export type BakingControllerStateProps = {
    active:     boolean;
    baking:     boolean;
    endorsing:  boolean;
    accusing:   boolean;
    rewarding:  boolean;
};

const defaultState = {
    active: false,
    baking: false,
    endorsing: false,
    accusing: false,
    rewarding: false
}

export default (state: BakingControllerStateProps = defaultState, action: ControllerActions) => {
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
