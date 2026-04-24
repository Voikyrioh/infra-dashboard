import process from 'node:process'
import { expect } from 'chai'
import { z } from 'zod'
import { generateConfig } from '../generate-config'

describe('config', () => {
    const testConfig = {
        test: {
            name: 'TEST',
            description: 'Test',
            validator: z.enum(['OK', 'BAD']),
            default: {
                _: 'BAD',
                test: 'OK'
            }
        }
    }

    const testInt = {
        test: {
            name: 'TEST',
            description: 'Test',
            validator: z.number(),
            default: {
                _: 1,
                test: 2
            }
        }
    }

    beforeEach(() => {
        delete process.env.TEST
        delete process.env.NODE_ENV
    })

    describe('string', () => {
        it('Should generate correct format', () => {
            process.env.TEST = 'OK'
            expect(generateConfig(testConfig)).to.deep.equal({test: 'OK'})
        })

        it('should use default _ if no env variable nor node_env is set', () => {
            expect(generateConfig(testConfig)).to.deep.equal({test: 'BAD'})
        });

        it('should use default value if no env is set', () => {
            process.env.NODE_ENV = 'test'

            expect(generateConfig(testConfig)).to.deep.equal({test: 'BAD'})
        });

        it('should throw an error if value is invalid', () => {
            process.env.TEST = 'INVALID'
            expect(() => generateConfig(testConfig)).to.throw()
        });
    })

    describe('string', () => {
        it('should use env variable if set', () => {
            process.env.TEST = "2"
            expect(generateConfig(testInt)).to.deep.equal({test: 2})
        });
    })
})
