import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';

import BakerInfo from '../Baker/BakerInfo';

import EndorsingRights from '../../containers/Widgets/Endorsing/EndorsingRights';
import BakingRights from '../../containers/Widgets/Baking/BakingRights';
import BakingController from '../../containers/Widgets/BakingController';

import { UserDataType } from '../../types';

const styles = ({}: Theme) => createStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        margin: 50
    },
    top: {
        display: 'flex',
        justifyContent: 'space-evenly',
        alignItems: 'stretch',
        alignContent: 'center'
    },
    widgets: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        alignContent: 'center',
        flexWrap: 'wrap'
    },
});

type Props = {
    userData: UserDataType;
    bakerInfo: any;
} & WithStyles<typeof styles>;

const Dashboard: React.FC<Props> = (props) => {
    const { classes, userData: { keys }, bakerInfo } = props;

    return keys ? (
        <div className={classes.root}>
            <div className={classes.top}>
                <BakerInfo bakerInfo={bakerInfo} />
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
