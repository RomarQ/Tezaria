import React from 'react';
import Wrapper from '../components/Dashboard/Dashboard';

import { UserDataType } from '../types';
import { UpdateUserDataPrototype } from '../actions/userData';

type Props = {
  userData: UserDataType
  loader: () => void;
  history: any;
};

const Dashboard: React.SFC<Props> = props => {
  return <Wrapper {...props} />;
}

export default Dashboard;