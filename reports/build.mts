// node --experimental-strip-types reports/build.mts <project> (build|watch)

import * as esbuild from 'esbuild'
import { exit } from 'process'

const subcommands = ['build', 'watch']
const [, , subcommand, project] = process.argv
if (!project || !subcommands.includes(subcommand)) {
  console.error(
    `Usage: node --experimental-strip-types reports/build.mts (${subcommands.join(
      '|'
    )}) <project>`
  )
  exit(1)
}

const watchMode = subcommand === 'watch'

const context = await esbuild.context({
  entryPoints: [`reports/${project}/index.tsx`],
  outfile: `reports/output/${project}.js`,
  bundle: true,
  minify: !watchMode,
  sourcemap: watchMode
})

if (watchMode) {
  const { port, hosts } = await context.serve({ servedir: './' })
  for (const host of hosts) {
    console.log(`http://${host}:${port}/reports/${project}/template.html`)
  }
} else {
  await context.rebuild()
  await context.dispose()
}
