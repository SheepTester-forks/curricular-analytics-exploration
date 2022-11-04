/** @jsxImportSource https://esm.sh/preact@10.11.2 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'https://esm.sh/preact@10.11.2'
import { useState } from 'https://esm.sh/preact@10.11.2/hooks'

type AppProps = {
  prereqs: Record<string, string[][]>
}
function App ({}: AppProps) {
  return (
    <>
      <p>Hi lmao</p>
    </>
  )
}

render(
  <App
    prereqs={JSON.parse(document.getElementById('prereqs')!.textContent!)}
  />,
  document.getElementById('root')!
)
