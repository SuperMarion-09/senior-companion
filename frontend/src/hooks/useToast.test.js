import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './useToast';

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success('Saved.')}>success</button>
      <button onClick={() => toast.error('Failed.')}>error</button>
    </>
  );
}

afterEach(() => {
  jest.useRealTimers();
});

test('success messages disappear on their own, errors stay until closed', () => {
  jest.useFakeTimers();
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  );

  userEvent.click(screen.getByRole('button', { name: 'success' }));
  userEvent.click(screen.getByRole('button', { name: 'error' }));
  expect(screen.getByText('Saved.')).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(10000);
  });
  expect(screen.queryByText('Saved.')).not.toBeInTheDocument();
  expect(screen.getByText('Failed.')).toBeInTheDocument();

  userEvent.click(screen.getByRole('button', { name: 'Close notification' }));
  expect(screen.queryByText('Failed.')).not.toBeInTheDocument();
});
