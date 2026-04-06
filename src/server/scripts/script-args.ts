type ParsedDryRunArgs = {
  dryRun: boolean
}

export const parseOptionalEqualsArg = (argv: string[], flagName: string): string | null => {
  const flag = argv.find((arg) => arg.startsWith(`${flagName}=`))
  if (!flag) {
    return null
  }

  const value = flag.slice(`${flagName}=`.length).trim()
  return value.length > 0 ? value : null
}

export const parseDryRunArgs = (argv: string[]): ParsedDryRunArgs => {
  if (argv.includes('--write') && argv.includes('--dry-run')) {
    throw new Error('Cannot combine --write and --dry-run.')
  }

  if (argv.includes('--write')) {
    return { dryRun: false }
  }

  if (argv.includes('--dry-run')) {
    return { dryRun: true }
  }

  return { dryRun: true }
}
