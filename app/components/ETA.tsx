import React from 'react';
const moment = require('moment');
require('moment-precise-range-plugin');

moment().format();

const parseETA = (t:any) => (
    `${t.days>0 ? `${t.days}d` : ''} ${t.hours>0 ? `${t.hours}h` : ''} ${t.minutes>0 ? `${t.minutes}m` : ''} ${t.seconds>0 ? `${t.seconds}s` : ''}`
);

export default (timestamp:string) => {
    const [ETA, setETA] = React.useState(parseETA(moment.preciseDiff(timestamp, new Date(), true)));

    React.useEffect(() => {
        const timeout = setInterval(() => setETA(parseETA(moment.preciseDiff(timestamp, new Date(), true))), 1000);
        return () => clearInterval(timeout);
    }, [ETA]);

    return ETA;
}
