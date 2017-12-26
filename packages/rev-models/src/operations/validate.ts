import { IModel, IModelManager } from '../models/types';
import { IModelOperation } from './operation';
import { ModelValidationResult } from '../validation/validationresult';
import { VALIDATION_MESSAGES as msg } from '../validation/validationmsg';
import { withTimeout } from '../utils';

export interface IValidationOptions {
    timeout?: number;
}

export interface IValidationContext {
    manager: IModelManager;
    operation: IModelOperation;
    result: ModelValidationResult;
    options?: IValidationOptions;
}

export async function validate<T extends IModel>(manager: IModelManager, model: T, operation?: IModelOperation, options?: IValidationOptions): Promise<ModelValidationResult> {

    let meta = manager.getModelMeta(model);

    let timeout = options && options.timeout ? options.timeout : 5000;
    let result = new ModelValidationResult();

    // First, check if model contains fields that are not in meta
    for (let field of Object.keys(model)) {
        if (!(field in meta.fieldsByName)) {
            result.addModelError(msg.extra_field(field), 'extra_field');
        }
    }

    // Trigger field validation
    let promises: Array<Promise<any>> = [];
    for (let field of meta.fields) {
        promises.push(field.validate(manager, model, operation, result, options));
    }
    await withTimeout(Promise.all(promises), timeout, 'validate()');

    // Trigger model validation
    if (typeof model.validate == 'function') {
        model.validate({ manager, operation, result, options });
    }
    if (typeof model.validateAsync == 'function') {
        await withTimeout(
            model.validateAsync({ manager, operation, result, options }),
            timeout, 'validate()');
    }

    return result;

}
