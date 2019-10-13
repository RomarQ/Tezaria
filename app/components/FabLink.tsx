import React from 'react'
import Fab, { FabProps } from '@material-ui/core/Fab'
import { Link, LinkProps } from 'react-router-dom'
import { LocationDescriptor } from 'history'

interface Props extends FabProps {
  to?: LocationDescriptor
  replace?: boolean
}

const ForwardedLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => <Link innerRef={ref} {...props} />
)

const Component: React.FC<Props> = ({ to, ...props }) => (
  <Fab {...props} {...{ to }} component={to ? ForwardedLink : Fab} />
)

export default Component
