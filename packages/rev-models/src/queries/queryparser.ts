
import { ConjunctionNode } from './nodes/conjunction';
import { FieldNode } from './nodes/field';
import { ValueOperator } from './nodes/value';
import { ValueListOperator } from './nodes/valuelist';

import { IQueryParser, IQueryNode, IOperatorRegister } from './types';
import { printObj } from '../utils/index';
import { IModel, IModelManager } from '../models/types';

export class QueryParser implements IQueryParser {
    CONJUNCTION_OPERATORS: IOperatorRegister = {};
    FIELD_OPERATORS: IOperatorRegister = {};
    OPERATOR_PREFIX: string = '_';

    constructor(public manager: IModelManager) {

        this.registerConjunctionOperators({
            _and: ConjunctionNode,
            _or: ConjunctionNode
        });

        this.registerFieldOperators({
            _eq: ValueOperator,
            _ne: ValueOperator,
            _gt: ValueOperator,
            _gte: ValueOperator,
            _lt: ValueOperator,
            _lte: ValueOperator,
            _like: ValueOperator,

            _in: ValueListOperator,
            _nin: ValueListOperator
        });
    }

    registerConjunctionOperators(operators: IOperatorRegister) {
        Object.assign(this.CONJUNCTION_OPERATORS, operators);
    }

    registerFieldOperators(operators: IOperatorRegister) {
        Object.assign(this.FIELD_OPERATORS, operators);
    }

    getQueryNodeForQuery<T extends IModel>(
            model: new() => T,
            value: object,
            parent?: IQueryNode<T>): IQueryNode<T> {

        if (!value || typeof value != 'object') {
            throw new Error(`${printObj(value)} is not a query object`);
        }

        const meta = this.manager.getModelMeta(model);

        let keys = Object.keys(value);
        if (keys.length == 1) {
            let key = keys[0];
            if (key in this.CONJUNCTION_OPERATORS) {
                return new (this.CONJUNCTION_OPERATORS[key])(this, model, key, value[key], parent);
            }
            else if (key in meta.fieldsByName) {
                return new FieldNode(this, model, key, value[key], parent);
            }
            throw new Error(`'${key}' is not a recognised field or conjunction operator`);
        }

        let queryTokens: any[] = [];
        for (let key of keys) {
            let token: any = {};
            token[key] = value[key];
            queryTokens.push(token);
        }
        return new this.CONJUNCTION_OPERATORS._and(this, model, '_and', queryTokens, parent);
    }
}
