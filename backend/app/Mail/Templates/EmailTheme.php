<?php

namespace App\Mail\Templates;

/**
 * The email design tokens: the Kaagapay brand colours (branding/03-brand-guidelines.html)
 * and fonts. Components in resources/views/components/email/ read them from
 * here, so a colour is changed in one place. Every text/background pair
 * used meets WCAG AA contrast (4.5:1) or better.
 */
final class EmailTheme
{
    public const COLORS = [
        'page' => '#f3efe5',        // behind the card
        'surface' => '#ffffff',     // the card
        'cream' => '#fbf8f1',       // panels inside the card
        'border' => '#e6e0d2',
        'text' => '#2e3333',        // 12:1 on white
        'muted' => '#5a605e',       // 6.4:1 on white
        'sage' => '#4e6e55',        // buttons, links: 5.7:1 with white
        'sage_deep' => '#3d5843',
        'sage_soft' => '#e7eee4',
        'clay' => '#a3502a',
        'clay_soft' => '#fbece4',
        'gold' => '#f3d9a4',
        'night' => '#1f2a27',       // footer
        'night_text' => '#eef1ec',
        'night_muted' => '#b9c4bd',
        'night_link' => '#9dbfa4',
    ];

    /** Message boxes and status pills: background, text and border colour. */
    public const TONES = [
        'info' => ['bg' => '#e7eee4', 'fg' => '#3d5843', 'border' => '#c9d8c6'],
        'success' => ['bg' => '#e6f4eb', 'fg' => '#1d6b3a', 'border' => '#bfe0ca'],
        'warning' => ['bg' => '#fdf3dc', 'fg' => '#6e4800', 'border' => '#f0d9a0'],
        'danger' => ['bg' => '#fbeae8', 'fg' => '#9a2318', 'border' => '#efc4be'],
        'clay' => ['bg' => '#fbece4', 'fg' => '#8c4423', 'border' => '#f0cdb9'],
        'neutral' => ['bg' => '#f3efe5', 'fg' => '#4a504e', 'border' => '#e6e0d2'],
    ];

    /** booking_status value => [label families see, tone]. */
    public const STATUSES = [
        'pending' => ['Waiting for confirmation', 'warning'],
        'confirmed' => ['Confirmed', 'success'],
        'rescheduled' => ['Rescheduled', 'info'],
        'completed' => ['Completed', 'info'],
        'cancelled' => ['Cancelled', 'neutral'],
        'rejected' => ['Not available', 'danger'],
    ];

    /*
    | Mail apps cannot download web fonts reliably, so each stack starts with
    | the brand font (shown where installed, e.g. Apple Mail) and falls back
    | to fonts every device has.
    */
    public const FONT_BODY = "'Atkinson Hyperlegible', 'Segoe UI', Helvetica, Arial, sans-serif";

    public const FONT_HEADING = "'Source Serif 4', Georgia, 'Times New Roman', serif";

    public const FONT_MONO = "'Courier New', Courier, monospace";

    /** @return array{bg: string, fg: string, border: string} */
    public static function tone(?string $tone): array
    {
        return self::TONES[$tone] ?? self::TONES['info'];
    }

    /** @return array{label: string, tone: array{bg: string, fg: string, border: string}} */
    public static function status(?string $status): array
    {
        [$label, $tone] = self::STATUSES[$status] ?? [ucfirst((string) $status), 'neutral'];

        return ['label' => $label, 'tone' => self::tone($tone)];
    }
}
