import React from 'react';
import { withStyles, createStyles, WithStyles, Theme } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import PaymentIcon from '@material-ui/icons/Payment';
import { Typography } from '@material-ui/core';
import Blockies from 'react-blockies';

import EnhancedTable from '../Table/EnhancedTable';

import utils from '../../utils/padaria/utils';
import rewardController, { DelegatorReward } from '../../utils/padaria/rewardController';

const styles = ({palette}:Theme) => createStyles({
    root: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'center',
        border: '2px solid #535671'
    },
    blockie: {
        width: 40,
        height: 40,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        borderRadius: '50%',
        backgroundColor: '#bdbdbd',
        padding: 5,
        marginRight: 10
    },
    delegatorLink: {
        display: 'flex',
        alignItems: 'center'
    },
    actions: {
        color: palette.text.secondary
    },
});

const columnNames = [
    {
        id: 'delegator',
        label: 'Delegator',
        orderWith: 'pkh'
    },
    {
        id: 'delegator_balance',
        label: 'Delegator Balance',
        numeric: true,
        orderWith: 'balance'
    },
    {
        id: 'share',
        label: 'Share',
        numeric: true,
        orderWith: 'balance'
    },
    {
        id: 'rewards_share',
        label: 'Rewards Share',
        numeric: true,
        orderWith: 'rewards'
    }
];

type Props = {
    paymentsAllowed: boolean;
    pkh: string;
    cycle: number;
    handleRewardsPayment: (selected:DelegatorReward[]) => Promise<any>;
} & WithStyles<typeof styles>;

const Component: React.FC<Props> = ({classes, pkh, cycle, paymentsAllowed, ...props}) => {
    const isMounted = React.useRef(true);
    const [selected, setSelected] = React.useState([]);
    const [orderBy, setOrderBy] = React.useState('balance');
    const [direction, setDirection] = React.useState('desc' as "asc" | "desc");
    const [rewards, setRewards] = React.useState([] as DelegatorReward[]);

    React.useEffect(() => {
        isMounted.current = true;
        rewardController.prepareRewardsToSendByCycle(pkh, cycle).then(res => {
            if(isMounted.current) setRewards(res);
        });

        return () => { isMounted.current = false; }
    }, []);
  
    const handleSortRequest = (event:React.MouseEvent<HTMLElement, MouseEvent>, property:string) => {
        const isDesc = orderBy === property && direction === 'desc';
        setDirection(isDesc ? 'asc' : 'desc');
        setOrderBy(property);
    };

    const handleRewardsPayment = () => {
        if (paymentsAllowed)
            props.handleRewardsPayment(rewards.filter(r => selected.includes(r.id)));
    }

    const getRow = (row:any, isItemSelected:boolean, handleClick:any) => (
        <TableRow
            hover
            onClick={event => handleClick(event, row.id)}
            role="checkbox"
            aria-checked={isItemSelected}
            tabIndex={-1}
            key={row.id}
            selected={isItemSelected}
        >
            <TableCell padding="checkbox">
                <Checkbox checked={isItemSelected} />
            </TableCell>
            <TableCell>
                <a className={classes.delegatorLink}>
                    <Blockies
                        seed={row.pkh}
                        className={classes.blockie}
                    />
                    <Typography variant="caption">{row.pkh}</Typography>
                </a>
            </TableCell>
            <TableCell align="right">
                <Typography variant="caption">{utils.parseTEZWithSymbol(row.balance)}</Typography>
            </TableCell>
            <TableCell align="right">
                <Typography variant="caption">{utils.getSharePercentage(row.balance, row.staking_balance)}</Typography>
            </TableCell>
            <TableCell align="right">
                <Typography variant="caption">
                    {utils.parseTEZWithSymbol(utils.getShareReward(row.balance, row.staking_balance, row.rewards))}
                </Typography>
            </TableCell>
        </TableRow>
    );

    const getActions = (numSelected:number) => (
        <div className={classes.actions}>
            {numSelected > 0 && paymentsAllowed ? (
                <Tooltip title="Send Payment">
                    <IconButton aria-label="Send Payment" onClick={handleRewardsPayment}>
                        <PaymentIcon color="secondary"/>
                    </IconButton>
                </Tooltip>
            ) : numSelected > 0 ? <Typography variant="h6" color="secondary">Rewards not ready yet!</Typography> : undefined
            }
        </div>
    );

    const handleSelectAll = (event:React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelecteds = rewards.map(n => n.id);
            setSelected(newSelecteds);
            return;
        }
        setSelected([]);
    }

    const handleSelect = (event:React.MouseEvent<HTMLElement, MouseEvent>, id:string) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [] as any[];
    
        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }
    
        setSelected(newSelected);
    };

    return (
        <EnhancedTable
            className={classes.root}
            tableTitle="Rewards per Delegator"
            columnNames={columnNames}
            data={rewards}
            selected={selected}
            getRow={getRow}
            getActions={getActions}
            handleSelect={handleSelect}
            handleSelectAll={handleSelectAll}
            handleSortRequest={handleSortRequest}
            direction={direction}
            orderBy={orderBy}
        />
    );
}

export default withStyles(styles)(Component);