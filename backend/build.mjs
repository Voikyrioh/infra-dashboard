import * as esbuild from 'esbuild'

await esbuild.build({
	entryPoints: ['src/index.ts'],
	bundle: true,
	platform: 'node',
	target: 'node24',
	format: 'esm',
	outfile: 'dist/index.js',
	packages: 'external',
	alias: {
		'@config': './src/config/index.ts',
		'@logger': './libraries/logger/index.ts',
		'@libraries': './libraries/index.ts',
		'@entities': './src/domain/entities/index.ts',
		'@custom-zod': './libraries/custom-zod-types/index.ts',
		'@errors': './libraries/errors',
	},
})

console.log('Build complete → dist/index.js')
