"use client";

import { ConnectButton } from "@/components/ConnectButton";
import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import Image from 'next/image';
import { Button, Card, CardActions, CardContent, FormControl, FormHelperText, InputBase, InputLabel, MenuItem, Select, SelectChangeEvent, styled, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { managers } from "@/utils/addresses";

export default function Home() {
  const [platform, setPlatform] = useState(managers[0].address);

  const handleChange = (event: SelectChangeEvent) => {
    setPlatform(event.target.value);
  };

  useEffect(() => { }, [platform])

  const NoUnderlineInput = styled(InputBase)({
    '&:before': {
      borderBottom: 'none',
    },
    '&:after': {
      borderBottom: 'none',
    },
    '&:hover:not(.Mui-disabled):before': {
      borderBottom: 'none',
    },
  });


  return (
    <div className="flex-row" style={{ justifyContent: "space-between", marginTop: "20px" }}>
      <Card variant="outlined" style={{ flex: 2 }}>
        <CardContent>
          <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
            <Select
              labelId="demo-simple-select-helper-label"
              id="demo-simple-select-helper"
              value={platform}
              onChange={handleChange}
              input={<NoUnderlineInput />}
            >
              {managers.map(p =>
                <MenuItem key={p.address} value={p.address}>{p.dex}</MenuItem>
              )}
            </Select>
          </FormControl>
          <Typography variant="h5" component="div">

          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>adjective</Typography>
          <Typography variant="body2">
            well meaning and kindly.
            <br />
            {'"a benevolent smile"'}
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small">Learn More</Button>
        </CardActions>
      </Card>
      <div style={{ width: "20px" }}></div>
      <Card variant="outlined" style={{ flex: 1 }}>
        <CardContent>
          <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
            Word of the Day
          </Typography>
          <Typography variant="h5" component="div">

          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>adjective</Typography>
          <Typography variant="body2">
            well meaning and kindly.
            <br />
            {'"a benevolent smile"'}
          </Typography>
        </CardContent>
        <CardActions style={{ flex: 1 }}>
          <Button size="small">Learn More</Button>
        </CardActions>
      </Card>
    </div>
  );
}