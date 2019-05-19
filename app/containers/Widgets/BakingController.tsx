import { Dispatch, bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';

import Component from '../../components/Widgets/BakingController';
import { BakingControllerStateProps } from '../../reducers/bakingController';
import ControllerActions from '../../actions/bakingController';

import LoggerActions from '../../actions/logger';

const ControllerProps = ({ bakingController }:{ bakingController: BakingControllerStateProps }) => ({ controllerState: bakingController });
const ControllerDispatchers = (dispatch: Dispatch) => ({ controllerFunc: bindActionCreators(ControllerActions, dispatch) });

// Logger
const LoggerDispatchers = (dispatch: Dispatch) => ({ logger: bindActionCreators(LoggerActions, dispatch) });

export default compose(
    connect(
        ControllerProps,
        ControllerDispatchers
    ),
    connect(
        null,
        LoggerDispatchers
    )
)(Component);