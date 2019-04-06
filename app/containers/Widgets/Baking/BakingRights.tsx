import React from 'react';

import Component from '../../../components/Widgets/Baking/BakingRights';
import { IncomingBakings, CompletedBaking } from '../../../utils/padaria/types';
import baker from '../../../utils/padaria/baker';

type Props = {
  pkh: string
};

export default (props:Props) => {
  const isMounted = React.useRef(true);
  const [incomingBakings, setIB] = React.useState(null as IncomingBakings);
  const [completedBakings, setCB] = React.useState(null as CompletedBaking[]);
  React.useEffect(() => {
    isMounted.current = true;
    getIncomingBakings();
    getCompletedBakings();
    return () => { isMounted.current = false; }
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => {
      getIncomingBakings();
      getCompletedBakings();
    }, 20000);

    return () => { clearInterval(id); }
  });

  const getIncomingBakings = async () => {
    const result = await baker.getIncomingBakings(props.pkh) as IncomingBakings;
    if(isMounted.current && !!result) {
      setIB(result);
    }
  }
  const getCompletedBakings = async () => {
    const result = await baker.getCompletedBakings(props.pkh) as CompletedBaking[];
    if(isMounted.current && !!result) {
      setCB(result);
    }
  }

  return <Component incomingBakings={incomingBakings} completedBakings={completedBakings} />;
}
