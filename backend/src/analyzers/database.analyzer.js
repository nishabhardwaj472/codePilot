import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default || _traverse;

export class DatabaseAnalyzer {
  /**
   * Scans JS/TS code files to statically extract Mongoose / MongoDB models and schema relationships.
   * @param {string} rootDir Path to project root
   * @param {string[]} relativeFiles List of relative file paths
   * @returns {Object} { tables: Array<DbTable>, relations: Array<DbRelation> }
   */
  static analyze(rootDir, relativeFiles) {
    const models = [];
    const relations = [];

    let modelX = 40;
    let modelY = 40;

    for (const relPath of relativeFiles) {
      const ext = path.extname(relPath).toLowerCase();
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) continue;

      const fullPath = path.join(rootDir, relPath);
      let code = '';
      try {
        code = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }

      const extracted = DatabaseAnalyzer.extractMongooseSchema(code, relPath, modelX, modelY);
      if (extracted.models.length > 0) {
        models.push(...extracted.models);
        relations.push(...extracted.relations);
        modelX += 280;
        if (modelX > 800) {
          modelX = 40;
          modelY += 240;
        }
      }
    }

    return {
      tables: models,
      relations,
    };
  }

  /**
   * Extracts Mongoose schema fields and model relationships from AST
   */
  static extractMongooseSchema(code, relPath, defaultX, defaultY) {
    const models = [];
    const relations = [];
    let ast;

    try {
      ast = parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'decorators-legacy'],
      });
    } catch {
      return { models, relations };
    }

    try {
      let schemaName = '';
      let modelName = '';
      const columns = [];

      // 1. Primary primary key _id
      columns.push({ name: '_id', type: 'ObjectId', key: 'pk' });

      traverse(ast, {
        // Detect model registration: mongoose.model('User', UserSchema) or model('User', UserSchema)
        CallExpression(pathNode) {
          const callee = pathNode.node.callee;
          const isModelCall =
            (callee.type === 'MemberExpression' && callee.property.name === 'model') ||
            (callee.type === 'Identifier' && callee.name === 'model');

          if (isModelCall && pathNode.node.arguments.length >= 1) {
            const firstArg = pathNode.node.arguments[0];
            if (firstArg.type === 'StringLiteral') {
              modelName = firstArg.value;
            }
          }
        },

        // Detect new Schema({ ... })
        NewExpression(pathNode) {
          const callee = pathNode.node.callee;
          const isSchemaNew =
            (callee.type === 'MemberExpression' && callee.property.name === 'Schema') ||
            (callee.type === 'Identifier' && callee.name === 'Schema');

          if (isSchemaNew && pathNode.node.arguments.length > 0) {
            const schemaObj = pathNode.node.arguments[0];
            if (schemaObj.type === 'ObjectExpression') {
              for (const prop of schemaObj.properties) {
                if (prop.type === 'ObjectProperty' && prop.key) {
                  const fieldName = prop.key.name || prop.key.value;
                  if (!fieldName) continue;

                  const parsedField = DatabaseAnalyzer.parseSchemaProperty(fieldName, prop.value);
                  columns.push(parsedField.column);

                  if (parsedField.refModel) {
                    relations.push({
                      id: `rel-${relPath}-${fieldName}`,
                      source: modelName || path.basename(relPath, path.extname(relPath)),
                      target: parsedField.refModel,
                      cardinality: parsedField.isArray ? '1:N' : 'N:1',
                    });
                  }
                }
              }
            }
          }
        },
      });

      if (!modelName) {
        // Fallback to filename (e.g. User.ts -> User)
        const baseName = path.basename(relPath, path.extname(relPath));
        if (baseName.toLowerCase().includes('model') || baseName.toLowerCase().includes('schema')) {
          modelName = baseName.replace(/model|schema/gi, '');
        } else {
          modelName = baseName;
        }
      }

      // Format model name cleanly
      modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

      if (columns.length > 1) {
        models.push({
          id: `model-${modelName.toLowerCase()}`,
          name: modelName,
          collection: `${modelName.toLowerCase()}s`,
          rows: `${columns.length} fields`,
          file: relPath,
          columns,
          x: defaultX,
          y: defaultY,
        });
      }
    } catch {
      // Traverse error
    }

    return { models, relations };
  }

  /**
   * Helper to extract field type and model references from AST node
   */
  static parseSchemaProperty(fieldName, node) {
    let typeName = 'String';
    let refModel = null;
    let isArray = false;
    let isFk = false;

    // String, Number, Date, Boolean, etc.
    if (node.type === 'Identifier') {
      typeName = node.name;
    } else if (node.type === 'MemberExpression') {
      typeName = node.property.name || 'Object';
      if (typeName === 'ObjectId') isFk = true;
    } else if (node.type === 'ArrayExpression') {
      isArray = true;
      if (node.elements.length > 0) {
        const el = node.elements[0];
        if (el.type === 'ObjectExpression') {
          const inner = DatabaseAnalyzer.parseObjectSchemaConfig(el);
          typeName = `Array<${inner.type}>`;
          refModel = inner.ref;
          if (inner.type === 'ObjectId') isFk = true;
        } else if (el.type === 'Identifier') {
          typeName = `Array<${el.name}>`;
        }
      } else {
        typeName = 'Array';
      }
    } else if (node.type === 'ObjectExpression') {
      const inner = DatabaseAnalyzer.parseObjectSchemaConfig(node);
      typeName = inner.type;
      refModel = inner.ref;
      if (inner.type === 'ObjectId') isFk = true;
    }

    return {
      column: {
        name: fieldName,
        type: typeName,
        key: isFk || refModel ? 'fk' : undefined,
      },
      refModel,
      isArray,
    };
  }

  static parseObjectSchemaConfig(objNode) {
    let type = 'String';
    let ref = null;

    for (const prop of objNode.properties) {
      if (prop.type === 'ObjectProperty' && prop.key) {
        const keyName = prop.key.name || prop.key.value;
        if (keyName === 'type') {
          if (prop.value.type === 'Identifier') {
            type = prop.value.name;
          } else if (prop.value.type === 'MemberExpression') {
            type = prop.value.property.name || 'Object';
          }
        } else if (keyName === 'ref') {
          if (prop.value.type === 'StringLiteral') {
            ref = prop.value.value;
          }
        }
      }
    }

    return { type, ref };
  }
}
