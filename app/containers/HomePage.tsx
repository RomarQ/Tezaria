import React from 'react';
import Home from '../components/Home';
import { UserDataType } from '../types';
import routes from '../constants/routes.json';

type Props = {
    userData: UserDataType;
    userDataFunc: any;
    history: any;
}

const HomePage: React.SFC<Props> = ({ userData, userDataFunc, history }) => {
    return <Home />;
}

export default HomePage;