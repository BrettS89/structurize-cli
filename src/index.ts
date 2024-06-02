#!/usr/bin/env node

import { Command } from 'commander'

import { publishSchemas, importInterfaces } from './handlers'

const program = new Command()

program.name('Structurize CLI').version('1.0.0').description('Structurize CLI')

program.command('publish-schemas')
  .argument('<string>', 'Unique app name')
  .argument('<string>', 'api token')
  .action(async (appName, apiToken) => {
    await publishSchemas(appName, apiToken)
  });

program.command('fetch-interfaces')
  .argument('<string>', 'apps')
  .argument('<string>', 'api token')
  .action(async (apps, apiToken) => {
    await importInterfaces(apps, apiToken)
  })

program.parse();
