import { expect } from 'chai';

import * as d from '../../../decorators';
import { QueryParser } from '../../queryparser';
import { ValueListOperator } from '../valuelist';
import { ModelManager } from '../../../models/manager';
import { InMemoryBackend } from '../../../backends/inmemory/backend';

class TestModel {
    @d.IntegerField()
        id: number;
    @d.TextField()
        name: string;
    @d.BooleanField()
        active: boolean;
}

let manager = new ModelManager();
manager.registerBackend('default', new InMemoryBackend());
manager.register(TestModel);
let parser = new QueryParser(manager);

describe('class ValueListOperator<T> - constructor', () => {

    it('throws if operator is not a field operator', () => {
        expect(() => {
            new ValueListOperator(parser, TestModel, '_and', [], null);
        }).to.throw('unrecognised field operator');
    });

    it('throws if value is not an array', () => {
        expect(() => {
            new ValueListOperator(parser, TestModel, '_in', null, null);
        }).to.throw('must be an array');
        expect(() => {
            new ValueListOperator(parser, TestModel, '_in', {} as any, null);
        }).to.throw('must be an array');
    });

    it('throws if an array element is not a field value', () => {
        expect(() => {
            new ValueListOperator(parser, TestModel, '_in', ['a', new RegExp('a')], null);
        }).to.throw('invalid field value');
    });

    it('does not throw if value array is empty', () => {
        expect(() => {
            new ValueListOperator(parser, TestModel, '_in', [], null);
        }).to.not.throw();
    });

    it('stores the operator and values as public properties', () => {
        let valueList = ['a', 'b'];
        let node = new ValueListOperator(parser, TestModel, '_in', valueList, null);
        expect(node.operator).to.equal('_in');
        expect(node.values).to.deep.equal(valueList);
    });

});
