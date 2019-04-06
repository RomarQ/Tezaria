import React from 'react';
import { withStyles, createStyles, WithStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';

import EnhancedTableToolbar from '../Table/EnhancedTableToolbar';
import EnhancedTableHead from '../Table/EnhancedTableHead';

const styles = () => createStyles({
    root: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'center',
    },
    table: {
        minWidth: 1020,
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    progress: {
        alignSelf: 'center',
        margin: 40
    }
});

interface Props extends WithStyles<typeof styles> {
    tableTitle: string;
    columnNames: {
        id: string;
        numeric?: boolean;
        disablePadding?: boolean;
        label?: string;
        orderWith: string;
    }[];
    selected: any[];
    data: any[];
    handleSelectAll: (event:React.ChangeEvent<HTMLInputElement>) => void;
    handleSelect: (event:React.MouseEvent<HTMLElement, MouseEvent>, id:string) => void;
    getRow: (row:any, isItemSelected:boolean, handleClick:any) => React.ReactChild;
    getActions: (numSelected:number) => React.ReactChild;
    className: string;
    handleSortRequest: (event:React.MouseEvent<HTMLElement, MouseEvent>, property:string) => void;
    direction: "asc" | "desc";
    orderBy: string;
}

const Component: React.SFC<Props> = props => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);

    const {
        classes, 
        columnNames, 
        getRow, 
        tableTitle, 
        data, 
        selected, 
        className, 
        getActions,
        handleSelectAll,
        handleSelect,
        handleSortRequest,
        direction = 'asc',
        orderBy
    } = props;

    const stableSort = ()  => data.sort((a, b) => direction === 'desc' ? desc(a, b) : -desc(a, b));
      
    const desc = (a:any, b:any) => Number(a[orderBy]) < Number(b[orderBy]) ? 1 : -1;
  
    const handleChangePage = (event:React.MouseEvent<HTMLButtonElement, MouseEvent>, page:number) => {
        setPage(page);
    }
  
    const handleChangeRowsPerPage = (event:React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(Number(event.target.value));
    }
  
    const isSelected = (id:string) => selected.indexOf(id) !== -1;
  
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

    return (
        <Paper className={className || classes.root}>
            {!data[0] ? <CircularProgress className={classes.progress} /> : (
                <React.Fragment>
                    <EnhancedTableToolbar tableTitle={tableTitle} numSelected={selected.length} getActions={getActions} />
                    <div className={classes.tableWrapper}>
                        <Table className={classes.table} aria-labelledby="tableTitle">
                            <EnhancedTableHead
                                columnNames={columnNames}
                                numSelected={selected.length}
                                direction={direction}
                                orderBy={orderBy}
                                onSelectAll={handleSelectAll}
                                onSortRequest={handleSortRequest}
                                rowCount={data.length}
                            />
                            <TableBody>
                                {stableSort().slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map(row => getRow(row, isSelected(row.id), handleSelect)
                                )}
                                {emptyRows > 0 && (
                                    <TableRow style={{ height: 49 * emptyRows }}>
                                        <TableCell colSpan={6} />
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 15]}
                        component="div"
                        count={data.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        backIconButtonProps={{
                            'aria-label': 'Previous Page',
                        }}
                        nextIconButtonProps={{
                            'aria-label': 'Next Page',
                        }}
                        onChangePage={handleChangePage}
                        onChangeRowsPerPage={handleChangeRowsPerPage}
                    />
                </React.Fragment>
            )}
        </Paper>
    )
}

export default withStyles(styles)(Component);