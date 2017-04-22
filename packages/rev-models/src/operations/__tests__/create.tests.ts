
import { expect } from 'chai';
import * as rewire from 'rewire';

import { Model } from '../../models/model';
import * as d from '../../decorators';
import * as create from '../create';
import { MockBackend } from './mock-backend';
import { ModelValidationResult } from '../../validation/validationresult';
import { DEFAULT_CREATE_OPTIONS } from '../create';
import { ModelRegistry } from '../../registry/registry';

let GENDERS = [
    ['male', 'Male'],
    ['female', 'Female']
];

class TestModel extends Model {
    @d.TextField()
        name: string;
    @d.SelectionField({ selection: GENDERS })
        gender: string;
    @d.IntegerField({ required: false, minValue: 10 })
        age: number;
    @d.EmailField({ required: false })
        email: string;
}

class TestModel2 extends Model {}

let rewired = rewire('../create');
let rwCreate: typeof create & typeof rewired = rewired as any;
let registry: ModelRegistry;
let mockBackend: MockBackend;

describe('rev.operations.create()', () => {

    beforeEach(() => {
        registry = new ModelRegistry();
        mockBackend = new MockBackend();
        registry.registerBackend('default', mockBackend);
        registry.register(TestModel);
    });

    it('calls backend.create() and returns successful result if model is valid', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        return rwCreate.create(registry, model)
            .then((res) => {
                expect(mockBackend.createStub.callCount).to.equal(1);
                let createCall = mockBackend.createStub.getCall(0);
                expect(createCall.args[1]).to.equal(model);
                expect(res.success).to.be.true;
                expect(res.validation).to.be.instanceOf(ModelValidationResult);
                expect(res.validation.valid).to.be.true;
            });
    });

    it('calls backend.create() with DEFAULT_CREATE_OPTIONS if no options are set', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        return rwCreate.create(registry, model, null)
            .then((res) => {
                expect(mockBackend.createStub.callCount).to.equal(1);
                let readCall = mockBackend.createStub.getCall(0);
                expect(readCall.args[1]).to.equal(model);
                expect(readCall.args[3]).to.deep.equal(DEFAULT_CREATE_OPTIONS);
            });
    });

    it('calls backend.create() with overridden options if they are set', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        return rwCreate.create(registry, model, { validation: {} })
            .then((res) => {
                expect(mockBackend.createStub.callCount).to.equal(1);
                let readCall = mockBackend.createStub.getCall(0);
                expect(readCall.args[1]).to.equal(model);
                expect(readCall.args[3].validation).to.deep.equal({});
            });
    });

    it('rejects if model is not registered', () => {
        let model = new TestModel2();
        return expect(rwCreate.create(registry, model))
            .to.be.rejectedWith('is not registered');
    });

    it('rejects with unsuccessful result when model required fields not set', () => {
        let model = new TestModel();
        return rwCreate.create(registry, model)
            .then((res) => { throw new Error('expected reject'); })
            .catch((res) => {
                expect(res).to.be.instanceof(Error);
                expect(res.message).to.equal('ValidationError');
                expect(res.result).to.exist;
                expect(res.result.success).to.be.false;
                expect(res.result.validation).to.be.instanceOf(ModelValidationResult);
                expect(res.result.validation.valid).to.be.false;
            });
    });

    it('rejects with unsuccessful result when model fields do not pass validation', () => {
        let model = new TestModel();
        model.name = 'Bill';
        model.gender = 'fish';
        model.age = 9;
        model.email = 'www.google.com';
        return rwCreate.create(registry, model)
            .then((res) => { throw new Error('expected reject'); })
            .catch((res) => {
                expect(res).to.be.instanceof(Error);
                expect(res.message).to.equal('ValidationError');
                expect(res.result).to.exist;
                expect(res.result.success).to.be.false;
                expect(res.result.validation).to.be.instanceOf(ModelValidationResult);
                expect(res.result.validation.valid).to.be.false;
            });
    });

    it('rejects with any operation errors added by the backend', () => {
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        mockBackend.errorsToAdd = ['some_backend_error'];
        return rwCreate.create(registry, model)
            .then((res) => { throw new Error('expected reject'); })
            .catch((res) => {
                expect(res).to.be.instanceof(Error);
                expect(res.result).to.exist;
                expect(res.result.success).to.be.false;
                expect(res.result.errors.length).to.equal(1);
                expect(res.result.errors[0].message).to.equal('some_backend_error');
            });
    });

    it('rejects with expected error when backend.create rejects', () => {
        let expectedError = new Error('epic fail!');
        let model = new TestModel();
        model.name = 'Bob';
        model.gender = 'male';
        mockBackend.errorToThrow = expectedError;
        return expect(rwCreate.create(registry, model))
            .to.be.rejectedWith(expectedError);
    });

});
