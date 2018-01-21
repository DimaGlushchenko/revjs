import { BooleanField, SelectField, ISelectFieldOptions } from '../selectionfields';
import { ModelValidationResult } from '../../validation/validationresult';
import { IFieldOptions, Field, DEFAULT_FIELD_OPTIONS } from '../field';
import { booleanValidator, requiredValidator, singleSelectionValidator, stringEmptyValidator, listEmptyValidator, multipleSelectionValidator } from '../../validation/validators';
import { IModelOperation } from '../../operations/operation';

import { expect } from 'chai';
import { ModelManager } from '../../models/manager';

class TestModel {
    value: any;
}

let manager = new ModelManager();

describe('rev.fields.selectionfields', () => {
    let testOp: IModelOperation = {
        operation: 'create'
    };
    let testModel: TestModel;
    let result: ModelValidationResult;

    beforeEach(() => {
        testModel = new TestModel();
        testModel.value = null;
        result = new ModelValidationResult();
    });

    describe('BooleanField', () => {

        it('creates a field with properties as expected', () => {
            let opts: IFieldOptions = {};
            let test = new BooleanField('value', opts);
            expect(test.name).to.equal('value');
            expect(test.options).to.deep.equal(DEFAULT_FIELD_OPTIONS);
            expect(test).is.instanceof(Field);
        });

        it('sets default field options if they are not specified', () => {
            let test = new BooleanField('value');
            expect(test.options).to.deep.equal(DEFAULT_FIELD_OPTIONS);
        });

        it('adds the booleanValidator by default', () => {
            let test = new BooleanField('value', { required: false });
            expect(test.validators[0]).to.equal(booleanValidator);
        });

        it('adds the "required" validator if options.required is true', () => {
            let test = new BooleanField('value', { required: true });
            expect(test.validators[0]).to.equal(requiredValidator);
            expect(test.validators[1]).to.equal(booleanValidator);
        });

        it('successfully validates a boolean value', () => {
            let test = new BooleanField('value', { required: true });
            testModel.value = false;
            return test.validate(manager, testModel, testOp, result)
                .then((res) => { expect(res.valid).to.be.true; });
        });

        it('successfully validates a null value if field not required', () => {
            let test = new BooleanField('value', { required: false });
            testModel.value = null;
            return test.validate(manager, testModel, testOp, result)
                .then((res) => { expect(res.valid).to.be.true; });
        });

        it('does not validate on null value if field is required', () => {
            let test = new BooleanField('value', { required: true });
            testModel.value = null;
            return test.validate(manager, testModel, testOp, result)
                .then((res) => { expect(res.valid).to.be.false; });
        });

        it('does not validate on non-boolean value', () => {
            let test = new BooleanField('value', { required: true });
            testModel.value = 'evidently!';
            return test.validate(manager, testModel, testOp, result)
                .then((res) => { expect(res.valid).to.be.false; });
        });

    });

    describe('SelectField', () => {
        let selection = [
            ['option1', 'Option 1'],
            ['option2', 'Option 2'],
            ['option3', 'Option 3']
        ];
        let testOpts = {selection: selection};

        it('creates a field with properties as expected', () => {
            let opts: ISelectFieldOptions = {selection: selection};
            let test = new SelectField('value', opts);
            expect(test.name).to.equal('value');
            expect(test.options).to.deep.equal(
                Object.assign({}, DEFAULT_FIELD_OPTIONS, opts));
            expect(test).is.instanceof(Field);
        });

        it('sets default field options if they are not specified', () => {
            let test = new SelectField('value', testOpts);
            expect(test.options).to.deep.equal(
                Object.assign({}, DEFAULT_FIELD_OPTIONS, testOpts));
        });

        it('adds the singleSelectionValidator by default', () => {
            let test = new SelectField('value', {selection: selection, required: false });
            expect(test.validators.length).to.equal(1);
            expect(test.validators[0]).to.equal(singleSelectionValidator);
        });

        it('adds the required validator and stringEmpty validator if options.required is true', () => {
            let test = new SelectField('value', {selection: selection, required: true });
            expect(test.validators.length).to.equal(3);
            expect(test.validators[0]).to.equal(requiredValidator);
            expect(test.validators[1]).to.equal(stringEmptyValidator);
            expect(test.validators[2]).to.equal(singleSelectionValidator);
        });

        it('adds the required validator and listEmpty validator if options.required is true and multiple = true', () => {
            let test = new SelectField('value', {selection: selection, required: true, multiple: true });
            expect(test.validators.length).to.equal(3);
            expect(test.validators[0]).to.equal(requiredValidator);
            expect(test.validators[1]).to.equal(listEmptyValidator);
            expect(test.validators[2]).to.equal(multipleSelectionValidator);
        });

        it('adds the multipleSelectionValidator if opts.multiple = true', () => {
            let test = new SelectField('value', {selection: selection, required: false, multiple: true });
            expect(test.validators.length).to.equal(1);
            expect(test.validators[0]).to.equal(multipleSelectionValidator);
        });

        it('cannot be created with a selection that is not an array', () => {
            expect(() => {
                new SelectField('value', {selection: 'aaa' as any});
            }).to.throw('"selection" option must be set to an array');
        });

        it('cannot be created with a single-dimension selection array', () => {
            expect(() => {
                new SelectField('value', {selection: ['aaa', 'bbb'] as any});
            }).to.throw('should be an array with two items');
        });

        it('cannot be created with a two-dimensional selection array with the wrong number of items', () => {
            expect(() => {
                new SelectField('value', {selection: [
                    ['aaa'],
                    ['bbb', 'ccc'],
                    ['ddd', 'eee', 'fff']
                ]});
            }).to.throw('should be an array with two items');
        });

        it('successfully validates a single value', () => {
            let test = new SelectField('value', {selection: selection});
            testModel.value = 'option2';
            return test.validate(manager, testModel, testOp, result)
                .then((res) => { expect(res.valid).to.be.true; });
        });

        it('successfully validates multiple values', () => {
            let test = new SelectField('value', {selection: selection, multiple: true });
            testModel.value = ['option1', 'option3'];
            return test.validate(manager, testModel, testOp, result)
                .then((res) => { expect(res.valid).to.be.true; });
        });

        it('successfully validates a null value if field not required', () => {
            let test = new SelectField('value', {selection: selection, required: false });
            testModel.value = null;
            return test.validate(manager, testModel, testOp, result)
                .then((res) => { expect(res.valid).to.be.true; });
        });

        it('does not validate on null value if field is required', () => {
            let test = new SelectField('value', {selection: selection, required: true });
            testModel.value = null;
            return test.validate(manager, testModel, testOp, result)
                .then((res) => { expect(res.valid).to.be.false; });
        });

        it('does not validate an invalid single value', () => {
            let test = new SelectField('value', {selection: selection});
            testModel.value = 'I am not an option';
            return test.validate(manager, testModel, testOp, result)
                .then((res) => { expect(res.valid).to.be.false; });
        });

        it('does not validate an invalid multi-value', () => {
            let test = new SelectField('value', {selection: selection});
            testModel.value = ['option1', 'nope', 'option3'];
            return test.validate(manager, testModel, testOp, result)
                .then((res) => { expect(res.valid).to.be.false; });
        });

    });

});
