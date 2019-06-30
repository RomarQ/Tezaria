import React from 'react'
import Button, { ButtonProps } from '@material-ui/core/Button'
import { Link, LinkProps } from 'react-router-dom'

import { LocationDescriptor } from 'history'

interface Props extends ButtonProps {
  to: LocationDescriptor
  replace?: boolean
}

const createLink = (props: LinkProps) => <Link {...props} />

const Component: React.FC<Props> = props => (
  <Button {...props} component={createLink as any} />
)

export default Component
