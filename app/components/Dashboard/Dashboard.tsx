import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import BakerPanel from '../Baker/BakerPanel';

import EndorsingRights from '../../containers/Widgets/Endorsing/EndorsingRights';
import BakingRights from '../../containers/Widgets/Baking/BakingRights';
import BakingController from '../../containers/Widgets/BakingController';

import { TezosCommitState } from'../../utils/padaria/utils';
import { UserDataType } from '../../types';


const styles = ({}: Theme) => createStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        margin: 50,
        width: '100%'
    },
    top: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        alignContent: 'center',
        marginBottom: 50
    },
    widgets: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignContent: 'center',
        flexWrap: 'wrap'
    },
});

type Props = {
    userData: UserDataType;
    bakerInfo: any;
    nodeInfo: TezosCommitState;
} & WithStyles<typeof styles>;

const Dashboard: React.FC<Props> = props => {
    const { classes, userData: { keys }, bakerInfo, nodeInfo } = props;
    return keys ? (
        <div className={classes.root}>
            <div className={classes.top}>
                <BakerPanel bakerInfo={bakerInfo} nodeInfo={nodeInfo} />
                <BakingController keys={keys} />
            </div>
            <div className={classes.widgets}>
                <EndorsingRights pkh={keys.pkh} />
                <BakingRights pkh={keys.pkh} />
            </div>
        </div>
    ) : null;
}

export default withStyles(styles)(Dashboard);
