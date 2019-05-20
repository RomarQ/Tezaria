import React from 'react';
import {
    createStyles,
    withStyles,
    WithStyles
} from '@material-ui/core/styles';

import BakerPanel from '../Baker/BakerPanel';
import EndorsingRights from '../../containers/Widgets/Endorsing/EndorsingRights';
import BakingRights from '../../containers/Widgets/Baking/BakingRights';
import BakingController from '../../containers/Widgets/BakingController';

import { TezosCommitProps } from '../../utils/padaria/utils';
import { DelegateProps } from '../../utils/padaria/bakingController';


const styles = () => createStyles({
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

interface Props extends WithStyles<typeof styles> {
    bakerInfo: DelegateProps & UserDataProps;
    nodeInfo: TezosCommitProps;
}

const Dashboard: React.FC<Props> = props => {
    const { classes, bakerInfo, nodeInfo } = props;
    return bakerInfo.keys ? (
        <div className={classes.root}>
            <div className={classes.top}>
                <BakerPanel bakerInfo={bakerInfo} nodeInfo={nodeInfo} />
                <BakingController keys={bakerInfo.keys} />
            </div>
            <div className={classes.widgets}>
                <EndorsingRights pkh={bakerInfo.keys.pkh} />
                <BakingRights pkh={bakerInfo.keys.pkh} />
            </div>
        </div>
    ) : null;
};

export default withStyles(styles)(Dashboard);
