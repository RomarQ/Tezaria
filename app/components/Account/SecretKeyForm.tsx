import React from 'react';
import TextField from '@material-ui/core/TextField';

import { crypto } from '../../utils/padaria';

export interface FormProps {
    className: string;
    onSubmit: (seeds:string, passphrase?:string) => void;
    actions?: React.ReactElement;
}

export default ({className, onSubmit, actions}:FormProps) => {
    const [secret, setSecret] = React.useState('');
    const [passphrase, setPassphrase] = React.useState('');

    const isEdesk = crypto.isEdesk(secret);
    const formSubmit = (event: React.FormEvent<HTMLFormElement>) => { 
        event.preventDefault(); 
        return isEdesk ? onSubmit(secret, passphrase) : onSubmit(secret);
    }

    return (
        <form className={className} onSubmit={formSubmit}>
            <TextField
                style={{ marginBottom: 10 }}
                id="sk-or-esk"
                required
                label="Required"
                type="password"
                placeholder="Secret key"
                onChange={(e) => setSecret(e.target.value)}
                fullWidth
                variant="filled"
                InputLabelProps={{
                    shrink: true
                }}
            />
            {isEdesk ? (
                <TextField
                    id="passphrase"
                    required
                    label="Required"
                    type="password"
                    placeholder="Passphrase"
                    onChange={(e) => setPassphrase(e.target.value)}
                    fullWidth
                    variant="filled"
                    InputLabelProps={{
                        shrink: true
                    }}
                />
            ) : null
            }
            {actions}
        </form>
    )
}