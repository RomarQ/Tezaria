import React from 'react';
import { withStyles, createStyles, WithStyles, Theme } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel, { TableSortLabelProps } from '@material-ui/core/TableSortLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';
import { lighten } from '@material-ui/core/styles/colorManipulator';

const styles = ({ palette, spacing }: Theme) => createStyles({
    root: {
        paddingRight: spacing.unit,
    },
    highlight:
        palette.type === 'light'
            ? {
                color: palette.secondary.main,
                backgroundColor: lighten(palette.secondary.light, 0.85),
            }
            : {
                color: palette.text.primary,
                backgroundColor: palette.secondary.dark,
            },
    spacer: {
        flex: '1 1 100%'
    },
    actions: {
        color: palette.text.secondary
    },
    title: {
        flex: '0 0 auto'
    },
});

interface Props extends WithStyles<typeof styles> {
    columnNames: {
        id: string;
        numeric?: boolean;
        disablePadding?: boolean;
        label?: string;
        orderWith: string;
    }[];
    numSelected: number;
    onSortRequest: (event:React.MouseEvent<HTMLElement, MouseEvent>, property:string) => void;
    onSelectAll: (e:React.ChangeEvent<HTMLInputElement>) => void;
    orderBy: string;
    rowCount: number;
}

const Component: React.FC<Props & TableSortLabelProps> = props => {
    const { 
        columnNames,
        numSelected,
        onSortRequest,
        onSelectAll,
        direction,
        orderBy,
        rowCount
    } = props;

    const createSortHandler = (property:string) => (event:React.MouseEvent<HTMLElement, MouseEvent>) => {
        onSortRequest(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell padding="checkbox">
                    <Checkbox
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={numSelected === rowCount}
                        onChange={onSelectAll}
                    />
                </TableCell>
                {columnNames.map(row => (
                    <TableCell
                        key={row.id}
                        align={row.numeric ? 'right' : 'left'}
                        padding={row.disablePadding ? 'none' : 'default'}
                        sortDirection={orderBy === row.id ? direction : false}
                    >
                        <Tooltip
                            title="Sort"
                            placement={row.numeric ? 'bottom-end' : 'bottom-start'}
                            enterDelay={300}
                        >
                            <TableSortLabel
                                active={orderBy === row.orderWith}
                                direction={direction}
                                onClick={createSortHandler(row.orderWith)}
                            >
                                {row.label}
                            </TableSortLabel>
                        </Tooltip>
                    </TableCell>
                    )
                )}
            </TableRow>
        </TableHead>
    );
};

export default withStyles(styles)(Component);