import { Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Component from '../../components/Widgets/BakingController';
import { BakingControllerStateProps } from '../../reducers/bakingController';
import ControllerActions from '../../actions/bakingController';

const ControllerProps = ({ bakingController }:{ bakingController: BakingControllerStateProps }) => ({ controllerState: bakingController });
const ControllerDispatchers = (dispatch: Dispatch) => ({ controllerFunc: bindActionCreators(ControllerActions, dispatch) });

export default connect(
    ControllerProps,
    ControllerDispatchers
)(Component);