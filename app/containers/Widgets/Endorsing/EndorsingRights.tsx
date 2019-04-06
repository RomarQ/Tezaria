import React from 'react';

import Component from '../../../components/Widgets/Endorsing/EndorsingRights';
import { IncomingEndorsings, CompletedEndorsing } from '../../../utils/padaria/endorser.d';
import endorser from '../../../utils/padaria/endorser';

type Props = {
    pkh: string
};

export default (props:Props) => {
    const isMounted = React.useRef(true);
    const [incomingEndorsings, setIE] = React.useState(null as IncomingEndorsings);
    const [completedEndorsings, setCE] = React.useState(null as CompletedEndorsing[]);
    React.useEffect(() => {
        isMounted.current = true;
        getIncomingEndorsings();
        getCompletedEndorsings();
        return () => { isMounted.current = false; }
    }, []);

    React.useEffect(() => {
        const id = setInterval(() => {
            getIncomingEndorsings();
            getCompletedEndorsings();
        }, 20000);

        return () => { clearInterval(id); }
    });

    const getIncomingEndorsings = async () => {
        const result = await endorser.getIncomingEndorsings(props.pkh) as IncomingEndorsings;
        if(isMounted.current && !!result) {
            setIE(result);
        }
    }
    const getCompletedEndorsings = async () => {
        const result = await endorser.getCompletedEndorsings(props.pkh) as CompletedEndorsing[];
        if(isMounted.current && !!result) {
            setCE(result);
        }
    }

    return <Component incomingEndorsings={incomingEndorsings} completedEndorsings={completedEndorsings} />;
}
