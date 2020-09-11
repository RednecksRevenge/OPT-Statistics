import React, { useState } from "react";
import { Tableau20 } from "chartjs-plugin-colorschemes/src/colorschemes/colorschemes.tableau";
import {
  Bar,
  BarChart,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "@material-ui/core";
import { xor } from "lodash";
import Button from "@material-ui/core/Button";

function PerformancePlayerBar({ datasets }) {
  const theme = useTheme();
  const [hiddenDataKeys, setHiddenDataKeys] = useState([
    // "median",
    "min",
    "mean",
    "max",
  ]);

  const handleLegendVisibility = (o) => {
    setHiddenDataKeys(xor(hiddenDataKeys, [o.dataKey]));
  };

  return (
    <ResponsiveContainer height={1000}>
      <BarChart
        layout={"vertical"}
        data={datasets}
        margin={{
          top: 0,
          right: 0,
          left: 0,
          bottom: theme.spacing(12),
        }}
        barCategoryGap={theme.spacing(0.33)}
        barGap={0}
      >
        <Legend
          verticalAlign="top"
          onClick={handleLegendVisibility}
          formatter={(name, { inactive }) => {
            return (
              <Button color={inactive ? "default" : "secondary"}>{name}</Button>
            );
          }}
        />
        <YAxis type="category" dataKey="player" interval={0} width={160} />
        <XAxis type="number" />
        <Tooltip />
        <Bar
          hide={hiddenDataKeys.includes("median")}
          unit=" fps"
          name={"Median"}
          dataKey="median"
          fill={Tableau20[1]}
        >
          <LabelList position={"insideLeft"} />
        </Bar>
        <Bar
          hide={hiddenDataKeys.includes("min")}
          unit=" fps"
          name="Minimum"
          dataKey="min"
          fill={Tableau20[5]}
        >
          <LabelList position={"insideLeft"} />
        </Bar>
        <Bar
          hide={hiddenDataKeys.includes("mean")}
          unit=" fps"
          name="Durchschnitt"
          dataKey="mean"
          fill={Tableau20[3]}
        >
          <LabelList position={"insideLeft"} />
        </Bar>
        <Bar
          hide={hiddenDataKeys.includes("max")}
          unit=" fps"
          name="Maximal"
          dataKey="max"
          fill={Tableau20[9]}
        >
          <LabelList position={"insideLeft"} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default PerformancePlayerBar;
