type ParsedDryRunArgs = {
  dryRun: boolean
}

export const parseDryRunArgs = (argv: string[]): ParsedDryRunArgs => {
  if (argv.includes('--write')) {
    return { dryRun: false }
  }

  if (argv.includes('--dry-run')) {
    return { dryRun: true }
  }

  return { dryRun: true }
}
