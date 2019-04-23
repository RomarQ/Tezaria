import React from 'react';
import Typography from '@material-ui/core/Typography';
const moment = require('moment');
require('moment-precise-range-plugin');

moment().format();

type Props = {
    timestamp: string;
};

const parseETA = (t:any) => (
    `${t.days>0 ? `${t.days}d` : ''} ${t.hours>0 ? `${t.hours}h` : ''} ${t.minutes>0 ? `${t.minutes}m` : ''} ${t.seconds>0 ? `${t.seconds}s` : ''}`
);

const Cell: React.FC<Props> = ({ timestamp }) => {
    const [ETA, setETA] = React.useState(parseETA(moment.preciseDiff(timestamp, new Date(), true)));

    React.useEffect(() => {
        const timeout = setInterval(() => setETA(parseETA(moment.preciseDiff(timestamp, new Date(), true))), 1000);
        return () => clearInterval(timeout);
    }, [timestamp]);

  return <Typography variant="caption">{ETA}</Typography>;
}

export default Cell;