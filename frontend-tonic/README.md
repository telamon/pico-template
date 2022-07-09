# pico-template Tonic-edition

> Tonic <3 Nuro

I want to try using tonic with nuro.

Reason we're breaking tonic no-build-step philosophy with rollup
is due to dependencies that need to be transpiled as
es-modules.

Technically there is nothing stopping us from providing pre-built
artifacts and directly include them from unpkg(CDN) but
that would break the pico-philosophy of no dependencies on centralized tech.

Anyway, "offline first" takes priority, artifacts suck and so does building. Ideas are welcome.

## Launch

```bash
$(npm bin)/rollup -c frontend-tonic/rollup.js -w
```
