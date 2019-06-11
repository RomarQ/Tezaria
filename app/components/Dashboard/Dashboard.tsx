import React from 'react';
import {
    createStyles,
    withStyles,
    WithStyles,
    Theme
} from '@material-ui/core/styles';
import Avatar from "@material-ui/core/Avatar";
import Chip from "@material-ui/core/Chip";

import Eta from '../ETA';
import BakerPanel from '../Baker/BakerPanel';
import EndorsingRights from '../../containers/Widgets/Endorsing/EndorsingRights';
import BakingRights from '../../containers/Widgets/Baking/BakingRights';
import BakingController from '../../containers/Widgets/BakingController';

import { TezosCommitProps } from '../../utils/padaria/utils';
import { DelegateProps } from '../../utils/padaria/bakingController';
import { BakingRight } from '../../utils/padaria/baker';


const styles = ({ palette }: Theme) => createStyles({
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
        paddingBottom: 20
    },
    widgets: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignContent: 'center',
        flexWrap: 'wrap'
    },
    chainInfo: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        alignContent: 'center',
        padding: 10,
        borderRadius: 10,
        backgroundColor: palette.background.paper,
        boxShadow: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
        marginBottom: 10
    },
    chip: {
        margin: 5
    }
});

interface Props extends WithStyles<typeof styles> {
    bakerInfo: DelegateProps & UserDataProps;
    nodeInfo: TezosCommitProps;
    chainInfo: BakingRight;
}

const Dashboard: React.FC<Props> = props => {
    const { classes, bakerInfo, nodeInfo, chainInfo } = props;
    return bakerInfo.keys ? (
        <div className={classes.root}>
            {chainInfo.level &&
                <div className={classes.chainInfo}>
                    <Chip
                        className={classes.chip}
                        color="primary"
                        avatar={<Avatar>{Eta(chainInfo.estimated_time)}</Avatar>}
                        label={`Next Level ${chainInfo.level}`}
                    />
                    <Chip
                        className={classes.chip}
                        color="primary"
                        label={`Delegate ${chainInfo.delegate}`}
                    />
                    <span></span>
                </div>
            }
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
