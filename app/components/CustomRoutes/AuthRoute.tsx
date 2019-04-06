import React from 'react';
import { Route, Redirect } from 'react-router-dom';

import routes from '../../constants/routes.json';

export default ({ userData: {ready, keys}, path, redirect, render: Component, ...rest }:any) => {

  if (!ready && rest.location.pathname !== routes.HOME) {
    return <Redirect to={{ pathname: routes.HOME }} />;
  } 
  else if(ready && path === routes.HOME) {
    return <Redirect to={{ pathname: routes.DASHBOARD }} />;
  }
  else if (ready && keys.encrypted && path !== routes.PROTECT_ACCOUNT) {
    return <Redirect to={{ pathname: routes.PROTECT_ACCOUNT }} />;
  }

  return <Route exact path={path} render={Component} />;
};