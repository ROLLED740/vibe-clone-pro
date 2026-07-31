'use client';

import { Sandpack } from '@codesandbox/sandpack-react';

/**
 * Renders one stored build variant in a live sandbox. Kept in its own client
 * component so the preview page itself can stay a server component.
 */
export default function ClonePreview({ code }: { code: string }) {
  return (
    <Sandpack
      template="react-ts"
      theme="dark"
      files={{
        '/App.tsx': code,
        '/public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-[#050505]">
    <div id="root"></div>
  </body>
</html>`,
      }}
      customSetup={{
        dependencies: {
          'lucide-react': 'latest',
          'framer-motion': 'latest',
        },
      }}
      options={{
        showNavigator: true,
        showTabs: true,
        editorHeight: '75vh',
        editorWidthPercentage: 45,
      }}
    />
  );
}
