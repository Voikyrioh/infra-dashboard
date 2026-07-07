import { expect } from 'chai'
import { parseDockerLogs } from '../get-app-logs/get-app-logs.service'

function frame(streamType: number, payload: string): Buffer {
	const body = Buffer.from(payload, 'utf-8')
	const header = Buffer.alloc(8)
	header.writeUInt8(streamType, 0)
	header.writeUInt32BE(body.length, 4)
	return Buffer.concat([header, body])
}

describe('get-app-logs service', () => {
	describe('parseDockerLogs', () => {
		it('démultiplexe les frames stdout/stderr et extrait les timestamps', () => {
			const raw = Buffer.concat([
				frame(1, '2026-07-07T20:00:00.123456789Z hello world\n'),
				frame(2, '2026-07-07T20:00:01.000000000Z oops stderr\n'),
			])

			const lines = parseDockerLogs(raw)

			expect(lines).to.have.length(2)
			expect(lines[0]).to.deep.include({
				timestamp: '2026-07-07T20:00:00.123Z',
				message: 'hello world',
				source: 'file',
			})
			expect(lines[1]!.message).to.equal('oops stderr')
		})

		it('gère une ligne coupée sur plusieurs frames', () => {
			const raw = Buffer.concat([
				frame(1, '2026-07-07T20:00:00.000000000Z part one '),
				frame(1, 'part two\n'),
			])

			const lines = parseDockerLogs(raw)

			expect(lines).to.have.length(1)
			expect(lines[0]!.message).to.equal('part one part two')
		})

		it('accepte la sortie brute des conteneurs TTY (pas de frames)', () => {
			const raw = Buffer.from(
				'2026-07-07T20:00:00.000000000Z tty line\nline without timestamp\n',
				'utf-8',
			)

			const lines = parseDockerLogs(raw)

			expect(lines).to.have.length(2)
			expect(lines[0]!.message).to.equal('tty line')
			expect(lines[1]!.message).to.equal('line without timestamp')
			expect(Date.parse(lines[1]!.timestamp)).to.be.a('number')
		})

		it('retourne [] sur un buffer vide', () => {
			expect(parseDockerLogs(Buffer.alloc(0))).to.deep.equal([])
		})
	})
})
