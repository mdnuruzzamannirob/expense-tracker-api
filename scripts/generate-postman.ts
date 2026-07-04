import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openApiSpec } from '../src/docs/swagger-data.js';

type OpenApiOperation = Record<string, any>;
type OpenApiPathItem = Record<string, OpenApiOperation>;

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const outputPath = resolve(root, 'docs', 'postman-collection.json');
const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;

const findSuccessResponse = (operation: OpenApiOperation) => {
  const responses = operation?.responses ?? {};
  const successCodes = ['200', '201', '202', '204'];

  for (const code of successCodes) {
    const response = responses[code];
    const json = response?.content?.['application/json'];
    if (json) {
      return { statusCode: code, response, json };
    }
  }

  return undefined;
};

const buildRequestBody = (operation: OpenApiOperation) => {
  const json = operation?.requestBody?.content?.['application/json'];
  if (json?.example) {
    return {
      mode: 'raw',
      raw: JSON.stringify(json.example, null, 2),
      options: { raw: { language: 'json' } },
    };
  }

  const formData = operation?.requestBody?.content?.['multipart/form-data'];
  if (formData?.schema) {
    return {
      mode: 'formdata',
      formdata: Object.entries(formData.schema.properties ?? {}).map(([key, schema]: [string, any]) => ({
        key,
        type: schema.format === 'binary' ? 'file' : 'text',
        value: schema.example ?? '',
      })),
    };
  }

  return undefined;
};

const buildResponseBody = (operation: OpenApiOperation) => {
  const success = findSuccessResponse(operation);
  const example = success?.json?.example;
  if (!example) return undefined;

  return [
    {
      name: `${success.statusCode} ${success.response.description ?? 'Success'}`,
      originalRequest: {},
      status: success.response.description ?? 'Success',
      code: Number(success.statusCode),
      header: [],
      body: JSON.stringify(example, null, 2),
    },
  ];
};

const buildHeaders = (operation: OpenApiOperation) => {
  const headers = [{ key: 'Accept', value: 'application/json' }];
  if (operation?.requestBody?.content?.['application/json']) {
    headers.push({ key: 'Content-Type', value: 'application/json' });
  }
  return headers;
};

const buildQuery = (operation: OpenApiOperation) =>
  (operation?.parameters ?? [])
    .filter((parameter: any) => parameter.in === 'query')
    .map((parameter: any) => ({
      key: parameter.name,
      value: parameter.schema?.example ?? '',
      description: parameter.description ?? '',
    }));

const buildUrl = (path: string, operation: OpenApiOperation) => ({
  raw: `{{baseUrl}}/api${path}`,
  host: ['{{baseUrl}}'],
  path: ['api', ...path.split('/').filter(Boolean)],
  query: buildQuery(operation),
});

const buildItem = ([path, methodsObject]: [string, OpenApiPathItem]) => {
  const operations = methods
    .filter((method) => methodsObject[method])
    .map((method) => {
      const operation = methodsObject[method];

      return {
        name: operation.summary ?? `${method.toUpperCase()} ${path}`,
        request: {
          method: method.toUpperCase(),
          header: buildHeaders(operation),
          url: buildUrl(path, operation),
          body: buildRequestBody(operation),
          description: operation.description ?? operation.summary ?? '',
        },
        response: buildResponseBody(operation),
      };
    });

  return { name: path, item: operations };
};

const groupByTag = () => {
  const groups = new Map<string, Array<[string, OpenApiPathItem]>>();

  for (const entry of Object.entries(openApiSpec.paths ?? {})) {
    const [, methodsObject] = entry;
    const firstOperation = methods.find((method) => methodsObject[method]);
    const tag = methodsObject[firstOperation ?? 'get']?.tags?.[0] ?? 'Ungrouped';

    const existing = groups.get(tag) ?? [];
    existing.push(entry as [string, OpenApiPathItem]);
    groups.set(tag, existing);
  }

  return [...groups.entries()].map(([name, items]) => ({
    name,
    item: items.map(buildItem),
  }));
};

const collection = {
  info: {
    name: 'Expense Tracker API',
    description: 'Auto-generated Postman collection from the OpenAPI source.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: groupByTag(),
  variable: [{ key: 'baseUrl', value: 'http://localhost:5000' }],
};

const main = async () => {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');
  console.log(`Postman collection written to ${outputPath}`);
};

void main().catch((error) => {
  console.error('Failed to generate Postman collection', error);
  process.exit(1);
});
