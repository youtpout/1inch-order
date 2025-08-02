import { InputBase, styled } from "@mui/material";

export const NoUnderlineInput = styled(InputBase)({
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