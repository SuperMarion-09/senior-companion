import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

test('calls onConfirm or onCancel from its buttons', () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  render(
    <ConfirmDialog open title="Cancel this booking?" confirmLabel="Yes, cancel" onConfirm={onConfirm} onCancel={onCancel}>
      This cannot be undone.
    </ConfirmDialog>
  );

  expect(screen.getByRole('dialog', { name: 'Cancel this booking?' })).toHaveAccessibleDescription(
    'This cannot be undone.'
  );

  userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalledTimes(1);

  userEvent.click(screen.getByRole('button', { name: 'Yes, cancel' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
