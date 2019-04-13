import React from 'react';
import { withStyles, createStyles, Theme, WithStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';
import Blockies from 'react-blockies';
import { KeysType } from '../../utils/padaria/types';

const styles = ({ palette }: Theme) => createStyles({
    root: {
        display: 'flex',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: palette.background.paper,
        padding: 5,
        borderRadius: 10,
        boxShadow: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
    },
    leftSection: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRight: '1px solid #000'
    },
    divider: {
        width: 1,
        height: '100%',
        marginLeft: 10,
        marginRight: 10,
        backgroudColor: '#000'
    },
    labelRow: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    blockie: {
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        borderRadius: '50%',
        backgroundColor: palette.grey[400],
        padding: 5,
        margin: 10
    },
    pkh: {
        margin: 10
    }
});

type Props = {
    bakerInfo: {
        balance: string;
        keys: KeysType;
    };
} & WithStyles<typeof styles>;

const Component: React.FC<Props> = ({ classes, bakerInfo }) => {
    return (
        <div className={classes.root}>
            <div className={classes.leftSection}>
                <div className={classes.labelRow}>
                    <Blockies
                        scale={10}
                        seed={bakerInfo.keys.pkh}
                        className={classes.blockie}
                    />
                    <Chip
                        label={bakerInfo.balance}
                        color="primary"
                        className={classes.pkh}
                    />
                </div>
                <Chip
                    label={bakerInfo.keys.pkh}
                    variant="outlined"
                    color="primary"
                    className={classes.pkh}
                />
            </div>
            <div className={classes.divider} />
            <div>
                <div className={classes.labelRow}>
                    <Typography variant="caption" children="Balance" />
                    <Chip
                        label={bakerInfo.balance}
                        color="secondary"
                        className={classes.pkh}
                    />
                </div>
            </div>
        </div>
    );
}

export default withStyles(styles)(Component);