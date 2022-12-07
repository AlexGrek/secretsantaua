import React from 'react';
import { Panel } from 'rsuite';

function Reveal(props) {
    if (props.secret) {
        return <Panel header="Твій клієнт" bordered>
            <h1 className='slow-appearing'>{props.secret.realName}</h1>
            <p><b>Побажання:</b><br/>{props.secret.wishes}<br/><br/><i>({props.secret.id})</i></p>
        </Panel>
    } else {
        return <p></p>
    }

}

export default Reveal;