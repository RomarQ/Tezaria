import { LoaderActionTypes, LoaderAction } from '../actions/loader';

interface State {
    loading: boolean;
    pending: string[]
}

export interface LoaderState {
    loader: State;
}

const defaultState = {
    loading: true,
    pending: [] as string[]
}

export default (state: State = defaultState, action: LoaderAction) => {
    let { pending } = state;
    switch (action.type) {
        case LoaderActionTypes.START:
            return {
                loading: true,
                pending: pending.includes(action.loadType) ? pending : [...pending, action.loadType]
            };
        case LoaderActionTypes.STOP:
            pending = pending.filter(type => type != action.loadType)
            return { 
                loading: pending.length > 0,
                pending
            };
        default:
            return state;
    }
}
