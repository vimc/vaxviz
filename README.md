# vaxviz

Vaccine impact visualisation tool

## Deployment

Vaxviz is deployed to github pages with a custom url: https://vaxviz.vaccineimpact.org

Deployments are triggered when a release of the repository is published, which initiates a run of the `deploy-to-pages.yml` workflow.
Go to https://github.com/vimc/vaxviz/releases/new to create a release.

### Vaxviz-staging

We also have a staging github pages deployment here: https://vimc.github.io/vaxviz-staging/

This is linked to the [vaxviz-staging](https://github.com/vimc/vaxviz-staging) repo and is deployed from the main branch
of vaxviz. When there is a push to main in vaxviz, the `deploy-to-staging.yml` workflow runs which checks out both vaxviz and
vaxviz-staging, builds the app in vaxviz, copies the dist folder to vax-staging then commits and pushes
the vaxviz-staging changes (on its main branch). An action in vaxviz-staging then deploys to pages on this push to main.

In order to push to a non-local repository we need to provide a token with permissions over vaxviz-staging, and set it
as the token in the Checkout action. This token has been created as a fine-grained token with read-write permissions on
Contents of the vaxviz-staging repo only, and has been set as the VAXVIZ_STAGING_TOKEN secret in the vaxviz repo. VIMC
does not allow creation of tokens without expiry and the current token will expire on 29/10/2026.

## Node version

Build with Node 24. There is currently (November '25) a problem with building @vue/devtools with Node 25 - an error 
relating to local storage is thrown. As per [this issue](https://github.com/vuejs/devtools/issues/979), using Node 24
is the current workaround. 

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

To run with test coverage:
```sh
npm run test:coverage
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

### Updating the static data

1. Download the dataviz.zip file from the VIMC reporting portal (packet group name paper-four-figures) and make note of the packet id.
1. Make directory `public/data/<packet-id>/csv`
1. Unzip the folder into `public/data/<packet-id>/csv`
1. Run `./scripts/convert-csv-files-to-json.sh <packet-id>` replacing the packet id argument
1. Update the Vue app to know which packet id to use (there will be a `packetId` const telling it which folder to load data from).

