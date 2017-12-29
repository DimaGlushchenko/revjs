
import { QueryNode } from './query';
import { IQueryParser, IQueryNode } from '../types';
import { isFieldValue } from '../utils';
import { ValueOperator } from './value';
import { IModel } from '../../models/types';

export class FieldNode<T extends IModel> extends QueryNode<T> {

    constructor(
            parser: IQueryParser,
            model: new() => T,
            public fieldName: string,
            value: any,
            parent: IQueryNode<T>) {

        super(parser, model, fieldName, parent);

        const meta = parser.manager.getModelMeta(model);

        if (!(fieldName in meta.fieldsByName)) {
            throw new Error(`'${fieldName}' is not a recognised field`);
        }
        else if (isFieldValue(value)) {
            this.children.push(new ValueOperator(parser, model, '_eq', value, this));
        }
        else if (!value || typeof value != 'object' || Object.keys(value).length == 0) {
            throw new Error(`invalid field query value for field '${fieldName}'`);
        }
        else {
            let keys = Object.keys(value);
            for (let key of keys) {
                if (!(key in parser.FIELD_OPERATORS)) {
                    throw new Error(`unrecognised field operator '${key}'`);
                }
                else {
                    this.children.push(new parser.FIELD_OPERATORS[key](parser, model, key, value[key], this));
                }
            }
        }
    }

}
