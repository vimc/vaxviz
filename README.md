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
