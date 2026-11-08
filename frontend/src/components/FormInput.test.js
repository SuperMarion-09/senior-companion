import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormInput from './FormInput';

test('links the hint and the first Laravel error message to the input', () => {
  render(<FormInput id="email" label="Email address" hint="We never share it." error={['Required.', 'Other.']} />);

  const input = screen.getByLabelText('Email address');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('We never share it. Required.');
  expect(screen.queryByText('Other.')).not.toBeInTheDocument();
});

test('password inputs can be shown and hidden', () => {
  render(<FormInput id="password" label="Password" type="password" />);

  const input = screen.getByLabelText('Password');
  expect(input).toHaveAttribute('type', 'password');

  userEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(input).toHaveAttribute('type', 'text');

  userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
  expect(input).toHaveAttribute('type', 'password');
});
