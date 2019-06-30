import React from 'react'
import Fab, { FabProps } from '@material-ui/core/Fab'
import { Link, LinkProps } from 'react-router-dom'
import { LocationDescriptor } from 'history'

interface Props extends FabProps {
  to: LocationDescriptor
  replace?: boolean
}

const createLink = (props: LinkProps) => <Link {...props} />

const Component: React.FC<Props> = props => (
  <Fab {...props} component={createLink as any} />
)

export default Component
