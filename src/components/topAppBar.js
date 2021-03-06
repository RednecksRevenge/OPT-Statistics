import React from "react";
import Toolbar from "@material-ui/core/Toolbar";
import { Hidden, IconButton, Typography } from "@material-ui/core";
import { OptFullLogo } from "../svg";
import AppBar from "@material-ui/core/AppBar";
import { Menu } from "@material-ui/icons";
import { useStyles } from "../styles";
import Authenticator from "./shared/authenticator";
import { Link } from "react-router-dom";

function TopAppBar({ onMenuClick }) {
  const classes = useStyles();
  return (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar>
        <Hidden lgUp>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
          >
            <Menu />
          </IconButton>
          <Link to={"/battle-announcement/latest"}>
            <OptFullLogo fill="#FFF" className={classes.logo} />
          </Link>
        </Hidden>
        <Hidden xsDown>
          <Typography variant="h6" noWrap>
            Operation Pandora Trigger
          </Typography>
        </Hidden>
        <Authenticator />
      </Toolbar>
    </AppBar>
  );
}

export default TopAppBar;
