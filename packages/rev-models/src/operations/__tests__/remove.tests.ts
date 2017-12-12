
import { expect } from 'chai';
import rewire = require('rewire');

import * as d from '../../decorators';
import * as remove from '../remove';
import { MockBackend } from './mock-backend';
import { DEFAULT_REMOVE_OPTIONS } from '../remove';
import { ModelManager } from '../../models/manager';
import { IRemoveOptions } from '../../models/types';

class TestModel {
    @d.TextField({ primaryKey: true })
        name: string;
    @d.IntegerField()
        age: number;
}

class TestModel2 {
    @d.TextField({ primaryKey: true, required: false })
        name: string;
}

class UnregisteredModel {}

class ModelWithNoPK {
    @d.TextField()
        name: string;
    @d.IntegerField()
        age: number;
}

let rewired = rewire('../remove');
let rwRemove: typeof remove & typeof rewired = rewired as any;
let mockBackend: MockBackend;
let manager: ModelManager;

describe('rev.operations.remove()', () => {

    let options: IRemoveOptions = {}; // where-clause stuff TO DO!

    beforeEach(() => {
        options = {
            where: {}
        };
        mockBackend = new MockBackend();
        manager = new ModelManager();
        manager.registerBackend('default', mockBackend);
        manager.register(TestModel);
        manager.register(ModelWithNoPK);
    });

    it('calls backend.remove() and returns successful result if model is valid', () => {
        let model = new TestModel();
        Object.assign(model, { name: 'bob', age: 21 });
        return rwRemove.remove(manager, model, options)
            .then((res) => {
                expect(mockBackend.removeStub.callCount).to.equal(1);
                let removeCall = mockBackend.removeStub.getCall(0);
                expect(removeCall.args[1]).to.equal(model);
                expect(removeCall.args[2]).to.equal(options.where);
                expect(res.success).to.be.true;
            });
    });

    it('calls backend.remove() with DEFAULT_REMOVE_OPTIONS if no options are set', () => {
        let model = new TestModel();
        Object.assign(model, { name: 'bob', age: 21 });
        let testOpts = Object.assign({}, DEFAULT_REMOVE_OPTIONS, options);
        return rwRemove.remove(manager, model, options)
            .then((res) => {
                expect(mockBackend.removeStub.callCount).to.equal(1);
                let removeCall = mockBackend.removeStub.getCall(0);
                expect(removeCall.args[1]).to.equal(model);
                expect(removeCall.args[2]).to.deep.equal(options.where);
                expect(removeCall.args[4]).to.deep.equal(testOpts);
            });
    });

    it('calls backend.remove() with overridden options if they are set', () => {
        let model = new TestModel();
        Object.assign(model, { name: 'bob', age: 21 });
        (options as any).someKey = 10;
        return rwRemove.remove(manager, model, options)
            .then((res) => {
                expect(mockBackend.removeStub.callCount).to.equal(1);
                let removeCall = mockBackend.removeStub.getCall(0);
                expect(removeCall.args[1]).to.equal(model);
                expect(removeCall.args[2]).to.deep.equal(options.where);
                expect(removeCall.args[4].someKey).to.equal(10);
            });
    });

    it('calls backend.remove() with primary key where clause when opts.where is not set', () => {
        let model = new TestModel();
        Object.assign(model, { name: 'bob', age: 21 });
        return rwRemove.remove(manager, model)
            .then((res) => {
                expect(mockBackend.removeStub.callCount).to.equal(1);
                let removeCall = mockBackend.removeStub.getCall(0);
                expect(removeCall.args[1]).to.equal(model);
                expect(removeCall.args[2]).to.deep.equal({
                    name: 'bob'
                });
            });
    });

    it('rejects if model is not registered', () => {
        let model = new UnregisteredModel();
        return rwRemove.remove(manager, model, options)
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err.message).to.contain('is not registered');
            });
    });

    it('rejects if model meta.stored is false', () => {
        manager.register(TestModel2, { stored: false });
        let model = new TestModel2();
        return rwRemove.remove(manager, model)
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err.message).to.contain('Cannot call remove() on models with stored: false');
            });
    });

    it('rejects when where clause is not specified and model has no primary key', () => {
        let model = new ModelWithNoPK();
        return rwRemove.remove(manager, model)
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err.message).to.contain('remove() must be called with a where clause for models with no primaryKey');
            });
    });

    it('rejects when where clause is not specified and model primaryKey is undefined', () => {
        let model = new TestModel();
        return rwRemove.remove(manager, model)
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err.message).to.contain('primary key field \'name\' is undefined');
            });
    });

    it('rejects with any operation errors added by the backend', () => {
        let model = new TestModel();
        Object.assign(model, { name: 'bob', age: 21 });
        mockBackend.errorsToAdd = ['some_backend_error'];
        return rwRemove.remove(manager, model, options)
            .then((res) => { throw new Error('expected reject'); })
            .catch((res) => {
                expect(res).to.be.instanceof(Error);
                expect(res.result).to.exist;
                expect(res.result.success).to.be.false;
                expect(res.result.errors.length).to.equal(1);
                expect(res.result.errors[0].message).to.equal('some_backend_error');
            });
    });

    it('rejects with expected error when backend.remove rejects', () => {
        let model = new TestModel();
        Object.assign(model, { name: 'bob', age: 21 });
        let expectedError = new Error('epic fail!');
        mockBackend.errorToThrow = expectedError;
        return rwRemove.remove(manager, model, options)
            .then(() => { throw new Error('expected to reject'); })
            .catch((err) => {
                expect(err).to.equal(expectedError);
            });
    });

});
