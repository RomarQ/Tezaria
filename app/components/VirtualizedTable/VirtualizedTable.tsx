import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import CircularProgress from '@material-ui/core/CircularProgress';
import { AutoSizer, Column, SortDirection, Table, TableProps } from 'react-virtualized';
import rowRenderer from './RowRenderer';

import ETACell from './ETACell';

const styles = ({typography}: Theme) => createStyles({
    table: {
        fontFamily: typography.fontFamily,
    },
    flexContainer: {
        display: 'flex',
        alignItems: 'center',
        boxSizing: 'border-box',
    },
    tableRow: {
        cursor: 'pointer',
    },
    tableRowHover: {
        '&:hover': {
        backgroundColor: 'red',
        },
    },
    tableCell: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    progress: {
        alignSelf: 'center',
        margin: 40
    }
});


const VirtualizedTable: React.SFC<WithStyles<typeof styles> & TableProps> = props => {
    const { 
        classes,
        columns,
        rowCount,
        rowGetter,
        rowHeight,
        ready,
        headerClassName,
        rowClassName,
        onRowClick,
        headerHeight,
        sort,
        cellClassName
    } = props

    const cellRenderer = ({ cellData, columnIndex = null }:any) => {
        
        if(columns[columnIndex].eta) {
            cellData = <ETACell timestamp={cellData} />
        } else if(columns[columnIndex].array && Array.isArray(cellData)) {
            cellData = cellData.join(', ');
        }

        return (
        <TableCell
            component="div"
            padding="dense"
            variant="body"
            style={{ paddingRight: 0, padding: 0, borderBottom: 'none' }}
            align={(columnIndex != null && columns[columnIndex].numeric) || false ? 'right' : 'left'}
        >
            {cellData}
        </TableCell>
        );
    };

    const headerRenderer = ({ label, columnIndex, dataKey, sortBy, sortDirection }:any) => {
        const direction = {
            [SortDirection.ASC]: 'asc',
            [SortDirection.DESC]: 'desc',
        };

        const inner =
            !columns[columnIndex].disableSort && sort != null ? (
                <TableSortLabel active={dataKey === sortBy} direction={direction[sortDirection]}>
                {label}
                </TableSortLabel>
            ) : (
                label
            );

        return (
            <TableCell
                component="div"
                padding="dense"
                variant="head"
                style={{ paddingRight: 0, padding: 0, borderBottom: 'none' }}
            >
                {inner}
            </TableCell>
        );
    };

    return !ready ? <CircularProgress className={classes.progress} /> : (
        <AutoSizer style={{ width: 'auto'}}>
            {({ height, width }) => (
                <Table
                    rowRenderer={rowRenderer}
                    rowStyle={{ paddingRight: 0 }}
                    className={classes.table}
                    headerClassName={headerClassName}
                    headerStyle={{padding: 0}}
                    height={height}
                    width={width}
                    rowHeight={rowHeight}
                    headerHeight={headerHeight}
                    rowCount={rowCount}
                    rowGetter={rowGetter}
                    rowClassName={rowClassName}
                >
                    {columns.map(({ cellContentRenderer = null, className, dataKey, ...other }:any, index:number) => {
                        let renderer;
                        if (cellContentRenderer != null) {
                            renderer = (cellRendererProps:any) =>
                                cellRenderer({
                                    cellData: cellContentRenderer(cellRendererProps),
                                    columnIndex: index,
                                });
                        } else {
                            renderer = cellRenderer;
                        }

                        return (
                        <Column
                            style={{ display: 'flex', height: '100%', borderBottom: 'none' }}
                            key={dataKey}
                            headerRenderer={headerProps =>
                                headerRenderer({
                                    ...headerProps,
                                    columnIndex: index,
                                })
                            }
                            className={classes.tableCell}
                            cellRenderer={renderer}
                            dataKey={dataKey}
                            {...other}
                        />
                        );
                    })}
                </Table>
            )}
        </AutoSizer>
    );
}

export default withStyles(styles)(VirtualizedTable);