import React, {useState} from 'react';
import { Tableau20 } from "chartjs-plugin-colorschemes/src/colorschemes/colorschemes.tableau";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

function PerformancePlayerBar({datasets}) {
    const [visibleDataKeys, setVisibleDataKeys] = useState(['min', 'max', 'median', 'mean']);
    const handleLegendVisibility = (o)=>{
        console.debug(o)
    }
    return (
        <ResponsiveContainer aspect={2.3}>
            <BarChart
                width={500}
                height={300}
                data={datasets}
                margin={{
                    top: 0, right: 0, left: 0, bottom: 0,
                }}
                barCategoryGap={'10%'}
                barGap={0}
            >
                <Legend verticalAlign="top" onClick={handleLegendVisibility} />
                <CartesianGrid />
                <XAxis dataKey="player" />
                <YAxis />
                <Tooltip />
                <Bar shape={"0"} unit="fps" name="Median" dataKey="median" fill={Tableau20[1]}/>
                <Bar shape={undefined} unit="fps" name="Minimum" dataKey="min" fill={Tableau20[5]}/>
                <Bar shape={""} unit="fps" name="Durchschnitt" dataKey="mean" fill={Tableau20[3]}/>
                <Bar shape={undefined} unit="fps" name="Maximal" dataKey="max" fill={Tableau20[9]}/>
            </BarChart>
        </ResponsiveContainer>
    );
}

export default PerformancePlayerBar;