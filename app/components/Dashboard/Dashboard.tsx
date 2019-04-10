import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';

import EndorsingRights from '../../containers/Widgets/Endorsing/EndorsingRights';
import BakingRights from '../../containers/Widgets/Baking/BakingRights';
import BakingController from '../../containers/Widgets/BakingController';

import { UserDataType } from '../../types';

const styles = ({}: Theme) => createStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        alignItems: 'center',
        alignContent: 'center',
        margin: 50
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
    loader: () => void;
    history: any;
} & WithStyles<typeof styles>;

const Dashboard: React.FC<Props> = (props) => {
    const isMounted = React.useRef(true);
    const { classes, userData: { keys } } = props;

    React.useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; }
    }, []);

    console.log(props)

    return keys ? (
        <div className={classes.root}>
            <BakingController keys={keys} />
            <div className={classes.widgets}>
                <EndorsingRights pkh={keys.pkh} />
                <BakingRights pkh={keys.pkh} />
            </div>
        </div>
    ) : null;
}

export default withStyles(styles)(Dashboard);
