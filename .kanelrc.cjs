const { makeKyselyHook, kyselyCamelCaseHook } = require('kanel-kysely')
const { generateIndexFile } = require('kanel')
const {
  makeGenerateZodSchemas,
  defaultGetZodSchemaMetadata,
  defaultGetZodIdentifierMetadata,
  defaultZodTypeMap,
  zodCamelCaseHook,
} = require('kanel-zod')

const CUSTOM_TYPE_MAP = {
  'pg_catalog.bytea': {
    typescript: 'Uint8Array',
    zod: 'z.instanceof(Uint8Array)',
  },
  'pg_catalog.int8': {
    typescript: 'number',
    zod: 'z.number()',
  },
  'pg_catalog.jsonb': {
    typescript: 'Record<string, unknown>',
    zod: 'z.record(z.string(), z.unknown())',
  },
}
const getTypeMap = (key) => {
  return Object.fromEntries(
    Object.entries(CUSTOM_TYPE_MAP).map(([k, v]) => [k, v[key]]),
  )
}

const generateZodSchemas = makeGenerateZodSchemas({
  getZodSchemaMetadata: defaultGetZodSchemaMetadata,
  getZodIdentifierMetadata: defaultGetZodIdentifierMetadata,
  zodTypeMap: {
    ...defaultZodTypeMap,
    ...getTypeMap('zod'),
  },
  castToSchema: true,
})

const generateKyselySchemas = makeKyselyHook()

/*
 * zod.castToSchema doesn't work with kysely
 * https://github.com/kristiandupont/kanel/issues/563
 */
const kanelKyselyZodCompatibilityHook = (_path, lines, _instantiatedConfig) => {
  const kanelZodCastRegex = /^\}\) as unknown as z\.Schema<\w+>;$/
  return lines.map((line) => {
    return line.replace(kanelZodCastRegex, '});')
  })
}

/*
 * Generated Database.ts is not compatible with TS verbatimModuleSyntax
 * https://github.com/kristiandupont/kanel/issues/436
 */
const supportVerbatimModuleSyntaxHook = (filePath, lines) => {
  if (filePath.endsWith('Database.ts')) {
    lines.pop()
    lines.push('export type { Database as default };')
  }
  return lines
}

const useTypedViewListsHoook = (filePath, lines) => {
  if (filePath === 'src/lib/__generated__/kanel/public/PointWithLabelList.ts') {
    lines.unshift("import { labelId, type LabelId } from './Label';")

    return lines.map((line) => {
      switch (line.trim()) {
        case 'labelIdList: ColumnType<string[], never, never>;': {
          return '  labelIdList: ColumnType<LabelId[], never, never>;'
        }
        case 'labelIdList: z.string().array(),': {
          return '  labelIdList: labelId.array(),'
        }
      }
      return line
    })
  }
  if (
    filePath === 'src/lib/__generated__/kanel/public/LabelWithParentList.ts'
  ) {
    return lines.map((line) => {
      switch (line.trim()) {
        case 'parentLabelIdList: ColumnType<string[], never, never>;': {
          return '  parentLabelIdList: ColumnType<LabelId[], never, never>;'
        }
        case 'parentLabelIdList: z.string().array(),': {
          return '  parentLabelIdList: labelId.array(),'
        }
      }
      return line
    })
  }
  if (filePath === 'src/lib/__generated__/kanel/public/Line.ts') {
    lines.unshift("import { labelId, type LabelId } from './Label';")

    return lines.map((line) => {
      switch (line.trim()) {
        case 'stoppedAt: ColumnType<number, never, never>;': {
          return '  stoppedAt: ColumnType<number | null, never, never>;'
        }
        case 'stoppedAt: z.number(),': {
          return '  stoppedAt: z.number().nullable(),'
        }
        case 'durationMs: ColumnType<number, never, never>;': {
          return '  durationMs: ColumnType<number | null, never, never>;'
        }
        case 'durationMs: z.number(),': {
          return '  durationMs: z.number().nullable(),'
        }
        case 'labelIdList: ColumnType<string[], never, never>;': {
          return '  labelIdList: ColumnType<LabelId[], never, never>;'
        }
        case 'labelIdList: z.string().array(),': {
          return '  labelIdList: labelId.array(),'
        }
      }
      return line
    })
  }
  return lines
}

/** @type {import('kanel').Config} */
module.exports = {
  // When `kanel` is called directly, it will use the DATABASE_URL environment
  //
  // However, when `kanel` is called by `graphile-migrate`, it will override
  // the DATABASE_URL environment variable and force us to use GM_DBURL
  // instead.
  connection: process.env.GM_DBURL ?? process.env.DATABASE_URL,

  schemas: ['public'],

  enumStyle: 'enum',

  outputPath: 'src/lib/__generated__/kanel',
  preDeleteOutputFolder: true,

  preRenderHooks: [
    generateKyselySchemas,
    kyselyCamelCaseHook,

    generateZodSchemas,
    zodCamelCaseHook,

    generateIndexFile,
  ],

  postRenderHooks: [
    kanelKyselyZodCompatibilityHook,
    supportVerbatimModuleSyntaxHook,
    useTypedViewListsHoook,
  ],

  customTypeMap: getTypeMap('typescript'),
}
