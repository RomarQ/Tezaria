import React from 'react'
import Button, { ButtonProps } from '@material-ui/core/Button'
import { Link, LinkProps } from 'react-router-dom'

import { LocationDescriptor } from 'history'

interface Props extends ButtonProps {
  to: LocationDescriptor
  replace?: boolean
}

const ForwardedLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => (
    // @ts-ignore
    <Link innerRef={ref} {...props} />
  )
)

const Component: React.FC<Props> = props => (
  // @ts-ignore
  <Button {...props} component={ForwardedLink} />
)

export default Component
