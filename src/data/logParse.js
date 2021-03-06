import moment, { duration } from "moment";
import { maxBy, meanBy, minBy, sortBy } from "lodash";
import { Tableau20 } from "chartjs-plugin-colorschemes/src/colorschemes/colorschemes.tableau";
import { GAMETIME_SCALE } from "../components/shared/statisticsProvider";

const scoreDatasets = [];
const dominationDatasets = [];
const budgetDatasets = [];
const playerStats = {};

const performanceDatasets = [];
const performanceBarDatasets = [];

const metadata = /(?:(?<date>\d{4}\/\d{2}\/\d{2}), )?(?<time>\d{2}:\d{2}:\d{2}) "\[OPT] \((?<type>Mission|Budget|Punkte|Fahne|Transport|Fraktionsübersicht|Abschuss|REVIVE)\) (?:Log: (?<gametime>\d{1,2}:\d{2}:\d{2})? ---)?/;

function getColorForFaction(side, alpha = 1) {
  switch (side?.toLowerCase()) {
    case "csat":
      return `rgba(255, 0, 0, ${alpha})`;
    case "nato":
      return `rgba(0, 0, 255, ${alpha})`;
    case "aaf":
    case "guer":
      return `rgba(0, 255, 0, ${alpha})`;
    case "arf":
      return `rgb(9, 90, 172, ${alpha})`;
    case "sword":
      return `rgb(255, 95, 0, ${alpha})`;
    default:
      console.error("unable to find color for side", side);
      return `rgba(0, 0, 0, ${alpha})`;
  }
}

function getFaction(rawSide) {
  switch (rawSide?.toLowerCase()) {
    case "arf":
    case "csat":
      return `arf`;
    case "sword":
    case "aaf":
    case "guer":
      return `sword`;
    default:
      return rawSide;
  }
}

function appendPlayerData(player, dataKey, dataValue) {
  if (player) {
    if (!playerStats[player]?.name) {
      const PRISTINE_STAT = {
        name: player,
        kills: 0,
        friendlyFires: 0,
        revives: 0,
        captures: 0,
        lightVehicle: 0,
        heavyVehicle: 0,
        airVehicle: 0,
        traveled: 0,
        carried: 0,
        passOuts: 0,
        moneySpent: 0,
        died: 0,
      };

      playerStats[player] = {
        ...PRISTINE_STAT,
        ...{ [dataKey]: dataValue },
      };
    } else {
      playerStats[player][dataKey] += dataValue;
    }
  }
}

function appendLineData(sourceDatasets, label, data, dataSettings = {}) {
  if (label) {
    const matchingDataset = sourceDatasets.find(
      (dataset) => dataset.label === label
    );
    if (!matchingDataset) {
      sourceDatasets.push({
        type: "line",
        label,
        borderWidth: 1,
        pointRadius: 0,
        lineTension: 0.22,
        data: [data],
        ...dataSettings,
      });
    } else {
      matchingDataset.data.push(data);
    }
  }
}

function parseBudget(line, gameTimeAsMilliseconds) {
  // 22:33:54 "[OPT] (Budget) Log: 2:24:45 --- AAF alt: 1.495e+06 - neu: 1.445e+06 - Differenz: -50000. Verondena (ver)kaufte WY-55 Hellcat (Unarmed)"
  const budgetMatch = line.match(
    /--- (?<rawSide>\w+) alt: (?<oldTotal>.+) - neu: (?<newTotal>.+) - Differenz: (?<balance>-?\d+). (?<player>.+) \(ver\)kaufte/
  );
  const { rawSide, newTotal, balance, player } = budgetMatch?.groups || {};
  const faction = getFaction(rawSide);
  if (faction) {
    appendLineData(
      budgetDatasets,
      faction,
      {
        t: gameTimeAsMilliseconds,
        x: gameTimeAsMilliseconds,
        y: +newTotal,
        line,
      },
      {
        steppedLine: "before",
        backgroundColor: getColorForFaction(faction, 0.05),
        hoverBackgroundColor: getColorForFaction(faction, 0.55),
        borderColor: getColorForFaction(faction, 1),
      }
    );
  }

  const parsedBalance = +balance * -1;
  if (player) {
    appendPlayerData(player, "moneySpent", parsedBalance);
  }

  // "20:00:12 "[OPT] (Budget) Log: 0:00:00 --- Startbudget: AAF:4e+06 - CSAT:4e+06""
  // TODO
  // "22:39:14 "[OPT] (Budget) Log: 2:30:05 --- Endbudget: (AAF:1.395e+06 | CSAT:14000)""
  // TODO
}

function parseRevive(line) {
  // REVIVE 22:36:52 "[OPT] (REVIVE) Log: 2:27:43 --- Joernrich (GUER) wurde von Gelir (GUER) wiederbelebt."
  const reviveMatch = line.match(
    /--- (?<patientPlayer>.+) \((?<patientSide>\w+)\) wurde von (?<medicPlayer>.+) \((?<medicSide>\w+)\) wiederbelebt./
  );
  const { medicPlayer } = reviveMatch?.groups || {};
  if (medicPlayer) {
    return appendPlayerData(medicPlayer, "revives", 1);
  }
}

function parseFlag(line, gameTimeAsMilliseconds) {
  const dominationMatch = line.match(
    /(?<flagSide>\w+) Flagge (?<action>gesichert|erobert) von (?<player>.*)"/
  );
  const { player, flagSide, action } = dominationMatch?.groups || {};
  if (player) {
    appendPlayerData(player, "captures", 1);
  }

  if (flagSide) {
    const faction = getFaction(flagSide);
    const color = getColorForFaction(
      action === "erobert" ? "arf" : "sword",
      0.3
    );

    appendLineData(
      dominationDatasets,
      `${faction}-${gameTimeAsMilliseconds}`,
      undefined,
      {
        type: "horizontalBar",
        //barPercentage: 1,
        //categoryPercentage: 1,
        //barThickness: 'flex',
        stack: faction,
        backgroundColor: color,
        borderColor: color,
        hoverBackgroundColor: color,
        data: [
          {
            t: gameTimeAsMilliseconds,
            x: gameTimeAsMilliseconds,
            y: faction,
            line,
          },
        ],
      }
    );
  }

  const scoreMatches = [...line.matchAll(/(?<rawSide>\w+) (?<score>\d+)/g)];
  scoreMatches.forEach((match) => {
    const { rawSide, score } = match?.groups || {};
    const faction = getFaction(rawSide);

    if (faction) {
      appendLineData(
        scoreDatasets,
        faction,
        {
          t: gameTimeAsMilliseconds,
          x: gameTimeAsMilliseconds,
          y: +score,
          line,
        },
        {
          backgroundColor: getColorForFaction(faction, 0.05),
          hoverBackgroundColor: getColorForFaction(faction, 0.55),
          borderColor: getColorForFaction(faction, 1),
        }
      );
    }
  });
}

function parseKill(line, gameTimeAsMilliseconds) {
  // 21:09:20 "[OPT] (Abschuss) Log: 1:00:11 --- Einheit: Pelle (side: GUER) von: Frozen_byte (side: EAST) (magazine: 5.8 mm 30Rnd Mag)"
  // 22:38:24 "[OPT] (Abschuss) Log: 2:29:15 --- Einheit: [THE](Cpt.)schmiet (side: EAST) von: Dominik (side: EAST) (magazine: 5.8 mm 30Rnd Mag)"
  const playerKillMatch = line.match(
    /--- Einheit: (?<victimPlayer>.+) \(side: (?<victimSide>\w+)\) von: (?<slayerPlayer>.+) \(side: (?<slayerSide>\w+)\) \((?<crimeWeapon>.+)\)/
  );
  // 21:11:35 "[OPT] (Abschuss) Log: 1:02:26 --- Fahrzeug: Strider (category: Leicht) (side: OPT_AAF) von: Wiesl (side: EAST) (vehicle: BTR-K Kamysh), Murda]X[ (side: EAST) (vehicle: BTR-K Kamysh), [GNC]Lord-MDB (side: EAST) (vehicle: BTR-K Kamysh)"
  // TODO vehicle Syntax?!

  //"22:39:08 "[OPT] (Abschuss) Log: 2:29:59 --- Einheit: Error: No unit (side: CIV) von: Scott (side: GUER) (magazine: RGO Grenade)""

  const { victimPlayer, slayerPlayer, victimSide, slayerSide } =
    playerKillMatch?.groups || {};

  if (!victimPlayer || !slayerPlayer) {
    console.error("unable to parse", { line, victimPlayer, slayerPlayer });
  } else if (victimSide === slayerSide) {
    appendPlayerData(slayerPlayer, "friendlyFires", 1);
  } else {
    appendPlayerData(victimPlayer, "passOuts", 1);
    appendPlayerData(slayerPlayer, "kills", 1);
  }
}

export function parseLog(log) {
  console.groupCollapsed("LogParseErrors");
  log
    .split("\n")
    .filter((line) => line.includes('"[OPT] ('))
    .forEach((line, i) => {
      const { type, gametime } = line.match(metadata)?.groups || {};
      const gameTimeAsMilliseconds = duration(
        gametime,
        "HH:mm:ss"
      ).asMilliseconds();
      if (i === 0) {
        GAMETIME_SCALE.ticks.min = gameTimeAsMilliseconds;
      }
      GAMETIME_SCALE.ticks.max = gameTimeAsMilliseconds;

      switch (type?.toLowerCase()) {
        case "revive":
          parseRevive(line);
          break;
        case "mission":
          // TODO parse mission 22:39:14 "[OPT] (Mission) Log: 2:30:05 --- Missionzeit abgelaufen" 9005000 and get max-x-axis
          break;
        case "budget":
          parseBudget(line, gameTimeAsMilliseconds);
          break;
        case "punkte":
          break;
        case "fahne":
          parseFlag(line, gameTimeAsMilliseconds);
          break;
        case "transport":
          break;
        case "fraktionsübersicht":
          break;
        case "abschuss":
          parseKill(line, gameTimeAsMilliseconds);
          break;
        default:
          console.error("Problems parsing line: '", line, "' for type:", type);
          break;
      }
    });
  console.groupEnd();

  return Promise.resolve({
    scoreDatasets,
    dominationDatasets,
    budgetDatasets,
    playerStats,
  });
}

export function parseFps(log) {
  let starttime;
  log.split("\n").forEach((line) => {
    const { datetime, player, fps } =
      line.match(
        /(?<datetime>\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}) - (?<player>.+);(?<fps>\d+\.\d+);/
      )?.groups || {};
    if (datetime) {
      if (!starttime) {
        starttime = +moment(datetime, "YYYY-MM-DD HH:mm:ss");
      }
      const gameTimeAsMilliseconds =
        +moment(datetime, "YYYY-MM-DD HH:mm:ss") - starttime;

      appendLineData(
        performanceDatasets,
        player,
        { t: gameTimeAsMilliseconds, y: +fps, line },
        {
          hidden: true,
          backgroundColor: "rgba(0,0,0,0)",
          lineTension: 0.25,
        }
      );
    }
  });

  // add median/average/highest/lowest thingies
  performanceDatasets.forEach((dataset) => {
    const max = maxBy(dataset.data, "y").y;
    const min = minBy(dataset.data, "y").y;
    const mean = meanBy(dataset.data, "y");
    const median = sortBy(dataset.data, "y")[Math.ceil(dataset.data.length / 2)]
      .y;
    appendLineData(performanceBarDatasets, "median", median, {
      type: "bar",
      borderColor: Tableau20[1],
      backgroundColor: Tableau20[1],
    });
    appendLineData(performanceBarDatasets, "min", min, {
      type: "bar",
      borderColor: Tableau20[5],
      backgroundColor: Tableau20[5],
      hidden: true,
    });
    appendLineData(performanceBarDatasets, "mean", mean, {
      type: "bar",
      borderColor: Tableau20[3],
      backgroundColor: Tableau20[3],
    });
    appendLineData(performanceBarDatasets, "max", max, {
      type: "bar",
      borderColor: Tableau20[9],
      backgroundColor: Tableau20[9],
      hidden: true,
    });
  });

  return Promise.resolve({
    performanceDatasets,
    performanceBarDatasets,
  });
}
