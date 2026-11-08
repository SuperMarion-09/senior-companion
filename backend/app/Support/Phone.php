<?php

namespace App\Support;

/**
 * Philippine phone number helpers. Mirrors normalizePhone / isValidPhone in
 * frontend/src/utils/booking.js, so the browser and the API agree.
 */
class Phone
{
    /**
     * "+63 917-123 4567" or "(0917) 123 4567" → "09171234567".
     */
    public static function normalize(?string $value): string
    {
        $digits = preg_replace('/\D/', '', (string) $value);

        return str_starts_with($digits, '63') ? '0'.substr($digits, 2) : $digits;
    }

    /**
     * Mobile (09XX XXX XXXX) or landline with area code (e.g. 02 8123 4567).
     */
    public static function isValid(?string $value): bool
    {
        return preg_match('/^(09\d{9}|0[2-8]\d{7,9})$/', self::normalize($value)) === 1;
    }
}
