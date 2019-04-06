import React from 'react'
import Fab, { FabProps } from '@material-ui/core/Fab';
import { Link } from 'react-router-dom';
import { LocationDescriptor } from 'history';

interface Props extends FabProps {
  to: LocationDescriptor
  replace?: boolean
}

const createLink = ({innerRef, ...props}: Props) => <Link {...props}/>;

export default class FabLink extends React.PureComponent<Props> {
  render() {
    return <Fab {...this.props} component={createLink}/>
  }
}
