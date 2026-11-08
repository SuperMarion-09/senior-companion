<?php

namespace App\Rules;

use App\Support\Phone;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PhilippinePhone implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! Phone::isValid($value)) {
            $fail('Please enter a valid Philippine phone number, for example 0917 123 4567.');
        }
    }
}
