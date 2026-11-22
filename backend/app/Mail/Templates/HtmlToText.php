<?php

namespace App\Mail\Templates;

/**
 * Builds the plain-text part of an email from its HTML, so every template
 * gets one without writing it twice. Plain text helps delivery (spam filters
 * like it) and is what some screen readers and smart watches show.
 *
 * Mark content that only makes sense in HTML with data-text="skip"
 * (e.g. the hidden inbox preview text or decorative icons).
 */
final class HtmlToText
{
    public static function convert(string $html): string
    {
        // Drop things that are not message content.
        $html = preg_replace('#<(head|style|script)\b[^>]*>.*?</\1>#is', '', $html);
        $html = preg_replace('#<!--.*?-->#s', '', $html);
        $html = self::removeSkipped($html);

        // Line breaks in the HTML source mean nothing; only tags decide the layout.
        $html = preg_replace('/\s+/', ' ', $html);

        // "Label: value" for detail rows.
        $html = preg_replace('#(<td\b[^>]*em-stack-label[^>]*>.*?)</td>#is', '$1: ', $html);

        // Links: "Label (https://…)", or just the address when the label is the address.
        $html = preg_replace_callback('#<a\b[^>]*href="([^"]*)"[^>]*>(.*?)</a>#is', function (array $match) {
            $href = html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5);
            $label = trim(preg_replace('/\s+/', ' ', strip_tags($match[2])));
            if ($label === '' && preg_match('#<img\b[^>]*alt="([^"]+)"#i', $match[2], $alt)) {
                $label = $alt[1];
            }
            $plainHref = preg_replace('#^(mailto:|tel:)#', '', $href);

            if (str_starts_with($href, 'tel:') && $label !== '') {
                return $label;
            }

            if ($label === '' || $label === $plainHref || $label === $href || str_starts_with($href, '#')) {
                return $label !== '' ? $label : $plainHref;
            }

            return "{$label} ({$plainHref})";
        }, $html);

        // Headings get a blank line around them; list items a bullet.
        $html = preg_replace('#<h[1-6]\b[^>]*>#i', "\n\n", $html);
        $html = preg_replace('#</h[1-6]>#i', "\n\n", $html);
        $html = preg_replace('#<li\b[^>]*>#i', "\n- ", $html);
        $html = preg_replace('#<br\s*/?>#i', "\n", $html);
        $html = preg_replace('#</(p|ul|ol)>#i', "\n\n", $html);
        $html = preg_replace('#</(div|tr|table)>#i', "\n", $html);
        $html = preg_replace('#<(p|tr)\b[^>]*>#i', "\n", $html);
        $html = preg_replace('#</td>#i', ' ', $html);

        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = str_replace(["\u{00A0}", "\u{200C}", "\u{200B}", "\u{034F}", "\u{00AD}"], [' ', '', '', '', ''], $text);

        $lines = array_map(fn ($line) => trim(preg_replace('/[ \t]+/', ' ', $line)), explode("\n", $text));
        $text = implode("\n", $lines);

        return trim(preg_replace("/\n{3,}/", "\n\n", $text))."\n";
    }

    /** Removes every element marked data-text="skip", including nested tags of the same name. */
    private static function removeSkipped(string $html): string
    {
        while (preg_match('#<([a-z0-9]+)\b[^>]*\bdata-text="skip"[^>]*>#i', $html, $match, PREG_OFFSET_CAPTURE)) {
            $tag = strtolower($match[1][0]);
            $start = $match[0][1];
            $pos = $start + strlen($match[0][0]);
            $depth = 1;

            while ($depth > 0 && preg_match("#<(/?){$tag}\b[^>]*>#i", $html, $next, PREG_OFFSET_CAPTURE, $pos)) {
                $depth += $next[1][0] === '/' ? -1 : 1;
                $pos = $next[0][1] + strlen($next[0][0]);
            }

            $html = substr($html, 0, $start).substr($html, $depth > 0 ? strlen($html) : $pos);
        }

        return $html;
    }
}
