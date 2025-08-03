import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
};

export function useConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<(value: boolean) => void>(() => () => {});

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = (result: boolean) => {
    setOptions(null);
    resolver(result);
  };

  const dialog = options ? (
    <Dialog open onClose={() => handleClose(false)}>
      <DialogTitle>{options.title || "Confirmation"}</DialogTitle>
      <DialogContent>
        <Typography>{options.message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)}>
          {options.cancelText || "Cancel"}
        </Button>
        <Button onClick={() => handleClose(true)} variant="contained" color="primary" autoFocus>
          {options.confirmText || "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  ) : null;

  return { confirm, ConfirmDialog: dialog };
}
