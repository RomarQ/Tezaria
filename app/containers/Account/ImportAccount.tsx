import React from 'react'
import { History } from 'history';

import ImportAccountForm from '../../components/Account/ImportAccountForm';
import ProtectAccount from '../../components/Account/ProtectAccount';

import { SetBakerKeysPrototype, ClearUserDataPrototype } from '../../actions/userData'; 
import { LoaderPrototype } from '../../actions/loader';

import { LoggerActionsPrototypes } from '../../actions/logger';

type Props = {
    history: History;
    setBakerKeys: SetBakerKeysPrototype;
    clearUserData: ClearUserDataPrototype;
    loader: LoaderPrototype;
    logger: LoggerActionsPrototypes;
};

export default (props:Props) => {
    const [keys, setKeys] = React.useState(null);

    return keys ? (
        <ProtectAccount
            keys={keys}
            {...props}
        />
    ) : (
        <ImportAccountForm
            handleImport={setKeys}
            {...props}
        />
    );
}
