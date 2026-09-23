import type { ParentProps } from 'solid-js';
import { HydrationScript } from '@solidjs/web';

// The document shell (the index.html replacement), picked up by the
// src/Document.* convention; it must render the full <html> and ships no
// client JS. <HydrationScript /> is stripped from the prerendered shell in
// client mode and activates under `ssr: true`. Delete this file to fall
// back to the plugin's built-in shell.
export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4d0218" />
        <link rel="icon" href="/scarlet-neet-icon.svg" />
        <link rel="apple-touch-icon" href="/scarlet-neet-icon-192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <title>GTG Routine</title>
        <HydrationScript />
      </head>
      <body>{props.children}</body>
    </html>
  );
}
