<?php

$term_width = 70;

function h1($text) {
    global $term_width;
    
    $border = "\033[1;34m" . str_repeat('=', $term_width) . "\033[0m";
    $textLength = mb_strlen($text);
    $paddingLength = intval(($term_width - $textLength) / 2);
    $padding = str_repeat(' ', $paddingLength);
    $formattedText = "\033[1m{$text}\033[0m";
    
    echo $border . PHP_EOL;
    echo $padding . $formattedText . $padding . PHP_EOL;
    echo $border . PHP_EOL;
}

function h2($text) {
    echo "\033[1;33m==>\033[37;1m {$text}\033[0m" . PHP_EOL;
}

function logger($input) {
    global $term_width;
    
    $width = $term_width - 9;
    $lines = explode("\n", $input);
    $output = [];
    
    foreach ($lines as $line) {
        // Check if line starts with ANSI color codes (matches /^\x1b\[[0-9;]*m/)
        if (preg_match('/^\033\[[0-9;]*m/', $line)) {
            // If it contains "Error:", pad before "Error:" (matches s/Error:/  \0/)
            if (strpos($line, 'Error:') !== false) {
                $output[] = preg_replace('/Error:/', '  Error:', $line, 1);
            } else {
                $output[] = $line;
            }
        } else {
            // Wrap long lines at word boundaries (like fold -s)
            $wrapped = wordwrap($line, $width, "\n", true);
            $wrappedLines = explode("\n", $wrapped);
            foreach ($wrappedLines as $wrappedLine) {
                // Pad all other lines with 9 spaces (matches s/.*/         \0/p)
                $output[] = '         ' . $wrappedLine;
            }
        }
    }
    
    echo implode("\n", $output) . PHP_EOL;
}

