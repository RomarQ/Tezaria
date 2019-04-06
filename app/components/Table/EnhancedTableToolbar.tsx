import React from 'react';
import { withStyles, createStyles, WithStyles, Theme } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import { lighten } from '@material-ui/core/styles/colorManipulator';

const styles = ({ palette, spacing }: Theme) => createStyles({
    root: {
        paddingRight: spacing.unit,
    },
    highlight: (
        palette.type === 'light'
            ? {
                color: palette.secondary.main,
                backgroundColor: lighten(palette.secondary.light, 0.85),
            }
            : {
                color: palette.text.primary,
                backgroundColor: palette.secondary.dark,
            }
    ),
    title: {
        flexGrow: 1
    },
});

interface Props extends WithStyles<typeof styles> {
    getActions: (numSelected:number) => React.ReactChild;
    numSelected: number;
    tableTitle: string;
}

const Component: React.SFC<Props> = ({classes, numSelected, tableTitle, getActions}) => {

    return (
        <Toolbar
            className={`${classes.root} ${numSelected > 0 ? classes.highlight : ''}`}
        >
            <div className={classes.title}>
                {numSelected > 0 ? (
                    <Typography color="inherit" variant="subtitle1">
                        {numSelected} selected
                    </Typography>
                    ) : (
                    <Typography variant="h6" id="tableTitle">
                        {tableTitle}
                    </Typography>
                )}
            </div>
            {getActions(numSelected)}
        </Toolbar>
    );
};

export default withStyles(styles)(Component);