import { Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Component from '../../components/Widgets/BakingController';
import { BakingControllerState } from '../../utils/padaria/types';
import ControllerActions from '../../actions/bakingController';

const ControllerProps = ({ bakingController }: {bakingController: BakingControllerState}) => bakingController;
const ControllerDispatchers = (dispatch: Dispatch) => bindActionCreators(ControllerActions, dispatch);

export default connect<any, any, any>(
  ControllerProps,
  ControllerDispatchers
)(Component);