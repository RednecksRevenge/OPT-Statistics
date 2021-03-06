import React, { useEffect, useState } from "react";
import { Typography } from "@material-ui/core";
import BattleEnrollButtonGroup from "./battleEnrollButtonGroup";
import { useListVals, useObjectVal } from "react-firebase-hooks/database";
import firebase from "firebase/app";
import { delay } from "../../shared/helpers/delay";
import { useLocalStorage } from "../../shared/helpers/useLocalStorage";
import { countBy, groupBy } from "lodash";
import Faction from "../../shared/faction";
import ParticipantGauge from "./participantGauge";
import { ExpandMore } from "@material-ui/icons";
import PlayerChip from "../../shared/playerChip";
import Collapse from "@material-ui/core/Collapse";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import clsx from "clsx";
import { useStyles } from "../../../styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import Box from "@material-ui/core/Box";

function BattleParticipants({ battleId }) {
  const classes = useStyles();
  const [counterGauges, setCounterGauges] = useState([]);
  const [expandParticipantNames, setExpandParticipantNames] = useState(false);
  const [steamProfile] = useLocalStorage("steamProfile", {
    avatar: undefined,
    personaname: undefined,
    profileurl: undefined,
    steamid: undefined,
  });
  const [battleParticipants] = useListVals(
    firebase.database().ref(`participants/${battleId}`)
  );
  const [enrollState] = useObjectVal(
    firebase
      .database()
      .ref(`participants/${battleId}/${steamProfile.steamid}/state`)
  );

  useEffect(() => {
    if (battleParticipants) {
      const participantsByFaction = groupBy(battleParticipants, "faction");
      const nextCounterGauges = [];
      for (const factionKey in participantsByFaction) {
        if (participantsByFaction.hasOwnProperty(factionKey)) {
          //state is: yes, no, maybe
          const stateCounts = countBy(
            participantsByFaction[factionKey],
            "state"
          );
          nextCounterGauges.push({
            factionKey,
            stateCounts,
            participants: participantsByFaction[factionKey],
          });
        }
      }
      setCounterGauges(nextCounterGauges);
    } else {
      setCounterGauges([]);
    }
  }, [battleParticipants]);

  const handleEnrollState = (state) => {
    if (battleId && steamProfile.steamid) {
      return firebase
        .database()
        .ref(`participants/${battleId}/${steamProfile.steamid}`)
        .transaction((oldState) => {
          if (oldState === null) {
            // create new
            return {
              steamName: steamProfile.personaname,
              steamId: steamProfile.steamid,
              steamAvatar: steamProfile.avatar,
              steamProfileUrl: steamProfile.profileurl,
              faction: "opt",
              state,
            };
          }
          return { ...oldState, state };
        })
        .then(() => delay(500));
    }
    return Promise.reject("missing auth");
  };

  return (
    <>
      <Typography variant={"h3"}>Anmeldungen</Typography>
      <Grid container spacing={3}>
        {counterGauges.length === 0 && (
          <Grid
            key={"empty-notice"}
            xs={7}
            item
            className={classes.emptyNotice}
          >
            <Typography variant={"h4"}>
              Keine Teilnehmer verzeichnet.
            </Typography>
          </Grid>
        )}
        {counterGauges.map(({ factionKey, stateCounts, participants }) => (
          <Grid key={factionKey} xs={4} item>
            <ButtonBase
              component={"div"}
              className={classes.participantActionArea}
              onClick={() => setExpandParticipantNames(!expandParticipantNames)}
            >
              <Typography variant={"h5"}>
                <Faction factionKey={factionKey} />
              </Typography>
              <ParticipantGauge {...stateCounts} />
              <IconButton
                className={clsx(classes.expand, {
                  [classes.expandOpen]: expandParticipantNames,
                })}
              >
                <ExpandMore />
              </IconButton>
            </ButtonBase>
            <Collapse
              in={expandParticipantNames}
              timeout="auto"
              className={classes.chipList}
              unmountOnExit
            >
              {participants.map(
                ({ state, steamId, steamName, steamAvatar }) => (
                  <PlayerChip
                    key={steamId}
                    label={steamName}
                    avatarSrc={steamAvatar}
                    state={state}
                  />
                )
              )}
            </Collapse>
          </Grid>
        ))}
        <Grid item className={classes.enrollWrapper}>
          <Typography display={"block"} variant={"button"}>
            Deine Teilnahme
          </Typography>
          <Box className={classes.enrollContainer}>
            {!steamProfile.steamid && (
              <Box className={classes.enrollHint}>
                Melde dich zuerst mittels STEAM an um deinen Status zu setzen.
              </Box>
            )}
            <BattleEnrollButtonGroup
              disabled={!steamProfile.steamid}
              orientation="vertical"
              disableElevation
              enrollState={enrollState}
              onEnrollStateChange={handleEnrollState}
            />
          </Box>
        </Grid>
      </Grid>
    </>
  );
}

export default BattleParticipants;
