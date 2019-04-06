import React from 'react'
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom';
import { ButtonProps } from '@material-ui/core/Button';
import { LocationDescriptor } from 'history';

interface Props extends ButtonProps {
  to: LocationDescriptor
  replace?: boolean
}

const createLink = ({innerRef, ...props}: Props) => <Link {...props}/>;

export default class ButtonLink extends React.PureComponent<Props> {
  render() {
    return <Button {...this.props} component={createLink}/>
  }
}
