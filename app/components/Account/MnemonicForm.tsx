import React from 'react';
import TextField from '@material-ui/core/TextField';

export interface FormProps {
    className: string;
    onSubmit: (seeds:string, passphrase:string, secret:string) => void;
    actions?: React.ReactElement;
}

export default ({className, onSubmit, actions}:FormProps) => {
    const [seeds, setSeeds] = React.useState('');
    const [passphrase, setPassphrase] = React.useState('');
    const [secret, setSecret] = React.useState('');

    const formSubmit = (e:any) => { 
        e.preventDefault(); 
        
        return onSubmit(seeds, passphrase, secret);
    }

    return (
        <form className={className} onSubmit={formSubmit}>
            <TextField
                style={{ marginBottom: 10, color: 'rgb(108, 115, 154)' }}
                id="seed-words"
                color="secondary"
                required
                multiline
                fullWidth
                rowsMax="5"
                rows="5"
                label="Required"
                placeholder="Seed Words"
                onChange={(e) => setSeeds(e.target.value)}
                variant="filled"
                InputLabelProps={{
                    shrink: true,
                }}
            />
            <TextField
            style={{ marginBottom: 10, color: 'rgb(108, 115, 154)' }}
                id="passphrase"
                label="Recommended"
                type="password"
                placeholder="Passphrase, email + password for faucet accounts"
                onChange={(e) => setPassphrase(e.target.value)}
                fullWidth
                variant="filled"
                InputLabelProps={{
                    shrink: true,
                }}
            />
            <TextField
                id="secret"
                label="Only use this field for ICO/Faucet Accounts!"
                type="password"
                placeholder="Only use this field for ICO/Faucet Accounts!"
                onChange={(e) => setSecret(e.target.value)}
                fullWidth
                variant="filled"
                InputLabelProps={{
                    shrink: true,
                }}
            />
            {actions}
        </form>
    )
};