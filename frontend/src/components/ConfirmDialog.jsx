import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = true,
  testId = 'confirm-dialog'
}) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border border-[#E6E2D8]" data-testid={testId}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#2C4C3B] text-xl font-semibold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#7D7D7D] whitespace-pre-line">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="border-[#E6E2D8] hover:bg-[#F7F5F0]"
            data-testid={`${testId}-cancel`}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={destructive
              ? 'bg-[#D96C4E] hover:bg-[#C2583D] text-white'
              : 'bg-[#2C4C3B] hover:bg-[#1F362A] text-white'
            }
            data-testid={`${testId}-confirm`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
