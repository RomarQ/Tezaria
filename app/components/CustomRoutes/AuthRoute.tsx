import React, { ReactNode } from 'react'
import { Route, Redirect, RouteProps } from 'react-router-dom'

import routes from '../../constants/routes.json'

interface Props extends RouteProps {
  userData: UserDataProps
  path: string
  render: () => ReactNode
}
/* eslint object-curly-newline: ["off"] */
export default ({
  userData: { ready, keys },
  path,
  render: Component,
  ...rest
}: Props) => {
  if (!ready && rest.location.pathname !== routes.HOME) {
    return <Redirect to={{ pathname: routes.HOME }} />
  }

  if (ready && path === routes.HOME) {
    return <Redirect to={{ pathname: routes.DASHBOARD }} />
  }

  if (ready && keys.encrypted && path !== routes.PROTECT_ACCOUNT) {
    return <Redirect to={{ pathname: routes.PROTECT_ACCOUNT }} />
  }

  return <Route exact path={path} render={Component} />
}
