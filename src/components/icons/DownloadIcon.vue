<!-- Store svg as component so that it can be rendered inline,
rather than serving from src/assets and wrapping it in an img tag.
This allows 'currentColor' to pick up the contextual CSS color, rather
than defaulting to black. -->
<template>
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V4M7 14H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2m-1-5-4 5-4-5m9 8h.01"/>
  </svg>
</template>
